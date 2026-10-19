import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }

    // Frontend demo only: real authentication must be implemented on a server.
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify({ email: email.trim() }));
    navigate("/dashboard");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon" aria-hidden="true"><img src="/brand-13.svg" alt="" /></div>
        <h1>خوش آمدی</h1>
        <p>وارد مسیر همراهی خودت شو.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">ایمیل</label>
          <input id="login-email" type="email" autoComplete="email" placeholder="example@email.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} required />
          <label htmlFor="login-password">رمز عبور</label>
          <input id="login-password" type="password" autoComplete="current-password" placeholder="رمز عبور" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} required />
          {error && <p className="form-message" role="alert">{error}</p>}
          <button type="submit" className="primary-button full-button">ورود</button>
        </form>
        <div className="auth-footer">حساب کاربری نداری؟ <Link to="/register">ثبت‌نام کن</Link></div>
        <p className="auth-demo-note">ورود در این نسخه آزمایشی است و هنوز اعتبارسنجی سمت سرور ندارد.</p>
      </div>
    </main>
  );
}

export default Login;
