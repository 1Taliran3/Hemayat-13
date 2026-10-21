import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/+$/, "");

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setError("لطفاً همه فیلدها را تکمیل کنید.");
      return;
    }
    if (cleanName.length > 100) {
      setError("نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("رمز عبور باید بین ۸ تا ۱۲۸ کاراکتر باشد.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(result?.message || `ثبت‌نام انجام نشد (خطای ${response.status}).`);
      }

      if (!result?.success || !result.token || !result.user) {
        throw new Error("پاسخ سرور کامل نیست. لطفاً دوباره تلاش کنید.");
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      console.error("Registration request failed:", requestError);
      setError(
        requestError instanceof TypeError
          ? "به بک‌اند وصل نشدیم. روشن بودن سرور و VITE_API_URL را بررسی کنید."
          : requestError.message || "ثبت‌نام انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon" aria-hidden="true"><img src="/brand-13.svg" alt="" /></div>
        <h1>ساخت حساب</h1>
        <p>برای حمایت و مشاهده سوابق خود ثبت‌نام کن.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="register-name">نام</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="نام شما"
            value={name}
            onChange={(event) => { setName(event.target.value); setError(""); }}
            maxLength={100}
            required
          />
          <label htmlFor="register-email">ایمیل</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            required
          />
          <label htmlFor="register-password">رمز عبور</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="حداقل ۸ کاراکتر"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            required
          />
          {error && <p className="form-message" role="alert">{error}</p>}
          <button type="submit" className="primary-button full-button" disabled={loading}>
            {loading ? "در حال ثبت‌نام..." : "ایجاد حساب"}
          </button>
        </form>
        <div className="auth-footer">قبلاً ثبت‌نام کرده‌ای؟ <Link to="/login">وارد شو</Link></div>
        <p className="auth-demo-note">رمز عبور در سرور به‌صورت هش‌شده ذخیره می‌شود.</p>
      </div>
    </main>
  );
}

export default Register;
