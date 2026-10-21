import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/+$/, "");

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(result?.message || `ورود انجام نشد (خطای ${response.status}).`);
      }

      if (!result?.success || !result.token || !result.user) {
        throw new Error("پاسخ سرور کامل نیست. لطفاً دوباره تلاش کنید.");
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("isLoggedIn", "true");

      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath && requestedPath !== "/login" ? requestedPath : "/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      console.error("Login request failed:", requestError);
      setError(
        requestError instanceof TypeError
          ? "به بک‌اند وصل نشدیم. روشن بودن سرور و VITE_API_URL را بررسی کنید."
          : requestError.message || "ورود انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon" aria-hidden="true"><img src="/brand-13.svg" alt="" /></div>
        <h1>خوش آمدی</h1>
        <p>وارد مسیر همراهی خودت شو.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">ایمیل</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            required
          />
          <label htmlFor="login-password">رمز عبور</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="رمز عبور"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            maxLength={128}
            required
          />
          {error && <p className="form-message" role="alert">{error}</p>}
          <button type="submit" className="primary-button full-button" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </form>
        <div className="auth-footer">حساب کاربری نداری؟ <Link to="/register">ثبت‌نام کن</Link></div>
        <p className="auth-demo-note">ورود از طریق سرور انجام می‌شود و اطلاعات حساب از پایگاه داده خوانده می‌شود.</p>
      </div>
    </main>
  );
}

export default Login;
