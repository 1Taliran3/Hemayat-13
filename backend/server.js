import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import process from "node:process";

const app = express();
const { Pool } = pg;
const PORT = Number(process.env.PORT) || 10000;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase Session Pooler commonly requires TLS.
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (error) => {
  console.error("Unexpected database pool error:", error.message);
});

const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      console.error("Ignoring invalid FRONTEND_ORIGIN entry");
      return null;
    }
  })
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  ...configuredOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      let parsedOrigin;
      try {
        parsedOrigin = new URL(origin);
      } catch {
        return callback(null, false);
      }

      const isAllowed = allowedOrigins.has(parsedOrigin.origin);
      const isVercelDeployment =
        parsedOrigin.hostname.endsWith(".vercel.app");

      return callback(null, isAllowed || isVercelDeployment);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "1mb" }));

async function queryDatabase(sql, params = []) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  return pool.query(sql, params);
}

function createToken(user) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateToken(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server authentication is not configured",
    });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error || !decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = decoded;
    next();
  });
}

// Always check the role in the database.
async function requireAdmin(req, res, next) {
  try {
    const result = await queryDatabase(
      "SELECT role FROM public.users WHERE id = $1 LIMIT 1",
      [req.user.id]
    );

    if (!result.rows.length || result.rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.userRole = result.rows[0].role;
    return next();
  } catch (error) {
    console.error("Admin authorization failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify permissions",
    });
  }
}

// Root and health checks
app.get("/", (_req, res) => {
  res.send("Hemayat 13 API is running!");
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is working!",
  });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const result = await queryDatabase(
      "SELECT NOW() AS current_time"
    );

    return res.json({
      success: true,
      message: "Database connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Register. The role is not accepted from the submitted form.
app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (
      name.length > 100 ||
      email.length > 254 ||
      password.length > 256
    ) {
      return res.status(400).json({
        success: false,
        message: "Input is too long",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await queryDatabase(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: createToken(user),
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (email.length > 254 || password.length > 256) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const result = await queryDatabase(
      `SELECT id, name, email, password_hash, role
       FROM public.users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const row = result.rows[0];
    const matched = await bcrypt.compare(
      password,
      row.password_hash
    );

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    return res.json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Current authenticated user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await queryDatabase(
      `SELECT id, name, email, role, created_at
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Loading current user failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load current user",
    });
  }
});

// Save a message.
// This route remains public for a possible contact form.
// Rate limiting should be added before a large public launch.
app.post("/api/messages", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    const result = await queryDatabase(
      `INSERT INTO public.test_messages (message)
       VALUES ($1)
       RETURNING id, message, created_at`,
      [message]
    );

    return res.status(201).json({
      success: true,
      message: "Message saved",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Saving message failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not save message",
    });
  }
});

// Only administrators can read submitted messages.
app.get(
  "/api/messages",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await queryDatabase(
        `SELECT id, message, created_at
         FROM public.test_messages
         ORDER BY created_at DESC
         LIMIT 200`
      );

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Loading messages failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not load messages",
      });
    }
  }
);

// Submit a donation request for the authenticated user.
app.post(
  "/api/donation-requests",
  authenticateToken,
  async (req, res) => {
    try {
      const donorName = String(
        req.body?.donorName || req.user.name || ""
      ).trim();

      const amount = Number(req.body?.amount);
      const message = String(req.body?.message || "").trim();

      if (
        !donorName ||
        donorName.length > 150 ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1e12
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid donor name and amount are required",
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Message is too long",
        });
      }

      const result = await queryDatabase(
        `INSERT INTO public.donation_requests
           (user_id, donor_name, amount, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, donor_name, amount,
                   message, status, created_at`,
        [req.user.id, donorName, amount, message]
      );

      return res.status(201).json({
        success: true,
        message: "Donation request submitted",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Donation request failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not submit donation request",
      });
    }
  }
);

// Only administrators can see the complete donation-request list.
app.get(
  "/api/donation-requests",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await queryDatabase(
        `SELECT id, user_id, donor_name, amount,
                message, status, created_at
         FROM public.donation_requests
         ORDER BY created_at DESC
         LIMIT 200`
      );

      return res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Loading donation requests failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not load donation requests",
      });
    }
  }
);

// Only administrators can change a donation-request status.
app.patch(
  "/api/donation-requests/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body?.status || "")
        .trim()
        .toLowerCase();

      const allowedStatuses = new Set([
        "pending",
        "approved",
        "rejected",
        "completed",
      ]);

      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        !allowedStatuses.has(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid request id or status",
        });
      }

      const result = await queryDatabase(
        `UPDATE public.donation_requests
         SET status = $1
         WHERE id = $2
         RETURNING id, user_id, donor_name, amount,
                   message, status, created_at`,
        [status, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Donation request not found",
        });
      }

      return res.json({
        success: true,
        message: "Donation status updated",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Updating donation status failed:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not update donation status",
      });
    }
  }
);

// API route not found
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.path,
  });
});

// Generic error handler: do not expose internal database details.
app.use((error, _req, res, _next) => {
  console.error("Request failed:", error.message);

  if (res.headersSent) return;

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hemayat 13 API running on port ${PORT}`);

  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured");
  }
});
