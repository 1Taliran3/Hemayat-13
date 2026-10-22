
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
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected database pool error:", error.message);
});

// CORS: allow localhost, configured frontend, and Vercel deployments.
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
].map((origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      let hostname;

      try {
        hostname = new URL(origin).hostname;
      } catch {
        return callback(new Error("Invalid request origin"));
      }

      const isVercel = hostname.endsWith(".vercel.app");
      const isAllowed = allowedOrigins.includes(
        new URL(origin).origin
      );

      if (isAllowed || isVercel) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked origin"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

// Check required configuration without exposing secrets.
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
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Authentication middleware
function authenticateToken(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server authentication is not configured",
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = decoded;
    next();
  });
}

// Root
app.get("/", (req, res) => {
  res.send("Hemayat 13 API is running!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!",
  });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await queryDatabase(
      "SELECT NOW() AS current_time"
    );

    res.json({
      success: true,
      message: "Database connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await queryDatabase(
      `SELECT id, name, email, role, created_at
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
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

// Register
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const existing = await queryDatabase(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await queryDatabase(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration failed:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

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

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const result = await queryDatabase(
      `SELECT id, name, email, password_hash, role
       FROM public.users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userRecord = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      userRecord.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    };

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
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

// Create a message
app.post("/api/messages", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
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

// List messages
app.get("/api/messages", async (req, res) => {
  try {
    const result = await queryDatabase(
      `SELECT id, message, created_at
       FROM public.test_messages
       ORDER BY created_at DESC
       LIMIT 100`
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
});

// Submit a donation request
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

      if (!donorName || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "A donor name and a valid amount are required",
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

// List donation requests
app.get("/api/donation-requests", async (req, res) => {
  try {
    const result = await queryDatabase(
      `SELECT id, donor_name, amount, message, status, created_at
       FROM public.donation_requests
       ORDER BY created_at DESC
       LIMIT 100`
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
});

// Not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.path,
  });
});

// General error handler
app.use((error, req, res, next) => {
  console.error("Request failed:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
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
