import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      setError("لطفاً همه فیلدها را تکمیل کنید.");
      return;
    }
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر داشته باشد.");
      return;
    }

    // Frontend demo only: real accounts must be created by a backend.
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify({ name: cleanName, email: cleanEmail }));
    navigate("/dashboard");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon" aria-hidden="true"><img src="/brand-13.svg" alt="" /></div>
        <h1>ساخت حساب</h1>
        <p>برای حمایت و مشاهده سوابق خود ثبت‌نام کن.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="register-name">نام</label>
          <input id="register-name" type="text" autoComplete="name" placeholder="نام شما" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} required />
          <label htmlFor="register-email">ایمیل</label>
          <input id="register-email" type="email" autoComplete="email" placeholder="example@email.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} required />
          <label htmlFor="register-password">رمز عبور</label>
          <input id="register-password" type="password" autoComplete="new-password" minLength={8} placeholder="حداقل ۸ کاراکتر" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} required />
          {error && <p className="form-message" role="alert">{error}</p>}
          <button type="submit" className="primary-button full-button">ایجاد حساب</button>
        </form>
        <div className="auth-footer">قبلاً ثبت‌نام کرده‌ای؟ <Link to="/login">وارد شو</Link></div>
        <p className="auth-demo-note">این فرم نمایشی است؛ برای حساب واقعی و امن، بک‌اند احراز هویت لازم است.</p>
      </div>
    </main>
  );
}

export default Register;
