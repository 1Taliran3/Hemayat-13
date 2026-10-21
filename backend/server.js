import bcrypt from "bcryptjs";
import cors from "cors";
import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT) || 10000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from backend .env");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from backend .env");
}

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json({ limit: "20kb" }));

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.on("error", (error) => {
  console.error("Unexpected database error:", error.message);
});

function signToken(user) {
  return jwt.sign(
    { userId: String(user.id) },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/* اعتبارسنجی توکن و تازه‌خوانی نقش کاربر از دیتابیس */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "ابتدا وارد حساب کاربری شوید.",
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "توکن ورود معتبر نیست یا منقضی شده است.",
    });
  }

  if (!payload?.userId) {
    return res.status(401).json({
      success: false,
      message: "توکن ورود معتبر نیست.",
    });
  }

  try {
    const result = await db.query(
      `SELECT id, name, email, role
       FROM public.users
       WHERE id = $1`,
      [payload.userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        success: false,
        message: "حساب کاربری پیدا نشد. دوباره وارد شوید.",
      });
    }

    const user = result.rows[0];
    req.user = {
      userId: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    console.error("Token user lookup failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "بررسی حساب کاربری انجام نشد.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "برای این عملیات دسترسی مدیر لازم است.",
    });
  }
  return next();
}

app.get("/", (req, res) => {
  res.send("Hemayat 13 API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend is working!" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW() AS server_time");
    return res.json({
      success: true,
      message: "Database connected!",
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database test failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* پیام‌های آزمایشی */
app.post("/api/messages", async (req, res) => {
  try {
    const { message } = req.body;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const result = await db.query(
      `INSERT INTO public.test_messages (message)
       VALUES ($1)
       RETURNING id, message, created_at`,
      [message.trim()]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Save failed:", error.message);
    return res.status(500).json({ success: false, message: "Could not save message" });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, message, created_at
       FROM public.test_messages
       ORDER BY id DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Read failed:", error.message);
    return res.status(500).json({ success: false, message: "Could not read messages" });
  }
});

/* ثبت‌نام؛ نقش مدیر هرگز از ورودی کاربر دریافت نمی‌شود */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || password.length < 8 || password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "نام، ایمیل معتبر و رمز عبور ۸ تا ۱۲۸ کاراکتری وارد کنید.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, passwordHash]
    );

    const user = result.rows[0];
    return res.status(201).json({
      success: true,
      message: "حساب کاربری با موفقیت ساخته شد.",
      token: signToken(user),
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "این ایمیل قبلاً ثبت شده است." });
    }
    console.error("Registration failed:", error.message);
    return res.status(500).json({ success: false, message: "ثبت‌نام انجام نشد." });
  }
});

/* ورود */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== "string" || typeof password !== "string" ||
      !email.trim() || !password || password.length > 128
    ) {
      return res.status(400).json({ success: false, message: "ایمیل و رمز عبور معتبر وارد کنید." });
    }

    const result = await db.query(
      `SELECT id, name, email, password_hash, role, created_at
       FROM public.users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "ایمیل یا رمز عبور اشتباه است." });
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
    return res.json({
      success: true,
      message: "ورود موفق بود.",
      token: signToken(user),
      user: publicUser,
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ success: false, message: "ورود انجام نشد." });
  }
});

/* اطلاعات حساب واردشده */
app.get("/api/auth/me", authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/* ثبت درخواست حمایت؛ این مسیر پرداخت واقعی انجام نمی‌دهد */
app.post("/api/donation-requests", authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 9999999999) {
      return res.status(400).json({ success: false, message: "مبلغ واردشده معتبر نیست." });
    }

    const result = await db.query(
      `INSERT INTO public.donation_requests (user_id, amount)
       VALUES ($1, $2)
       RETURNING id, user_id, amount, status, created_at`,
      [req.user.userId, amount]
    );

    return res.status(201).json({
      success: true,
      message: "درخواست با موفقیت ثبت شد.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Donation request failed:", error.message);
    return res.status(500).json({ success: false, message: "ثبت درخواست با خطا مواجه شد." });
  }
});

/* کاربر فقط سوابق خودش را می‌بیند؛ مدیر می‌تواند همه درخواست‌ها را ببیند */
app.get("/api/donation-requests", authenticateToken, async (req, res) => {
  try {
    const result = req.user.role === "admin"
      ? await db.query(
        `SELECT id, user_id, donor_name, amount, message, status, created_at
         FROM public.donation_requests
         ORDER BY created_at DESC
         LIMIT 100`
      )
      : await db.query(
        `SELECT id, user_id, amount, status, created_at
         FROM public.donation_requests
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [req.user.userId]
      );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Reading donation requests failed:", error.message);
    return res.status(500).json({ success: false, message: "دریافت درخواست‌ها انجام نشد." });
  }
});

/* تغییر وضعیت بررسی درخواست‌ها، فقط برای مدیر */
app.patch(
  "/api/donation-requests/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const { status } = req.body;
      const allowedStatuses = new Set(["pending", "approved", "rejected"]);

      if (!Number.isSafeInteger(requestId) || requestId <= 0 || !allowedStatuses.has(status)) {
        return res.status(400).json({
          success: false,
          message: "شناسه یا وضعیت درخواست معتبر نیست.",
        });
      }

      const result = await db.query(
        `UPDATE public.donation_requests
         SET status = $1
         WHERE id = $2
         RETURNING id, user_id, amount, status, created_at`,
        [status, requestId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: "درخواست پیدا نشد." });
      }

      return res.json({
        success: true,
        message: "وضعیت درخواست به‌روزرسانی شد. این تغییر به معنی ثبت پرداخت نیست.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Updating donation request failed:", error.message);
      return res.status(500).json({ success: false, message: "تغییر وضعیت درخواست انجام نشد." });
    }
  }
);

/* پاسخ JSON برای مسیرهای تعریف‌نشده */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `مسیر پیدا نشد: ${req.method} ${req.path}`,
  });
});

/* خطاهای JSON نامعتبر و خطاهای پیش‌بینی‌نشده */
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Unhandled server error:", error.message);
  const status = error instanceof SyntaxError && "body" in error ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: status === 400 ? "بدنهٔ درخواست JSON معتبر نیست." : "خطای داخلی سرور رخ داد.",
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Backend running on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
