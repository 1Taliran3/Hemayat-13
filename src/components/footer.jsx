import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand-block">
          <Link to="/" className="footer-logo">
            <img src="/brand-13.svg" alt="" />
            <span>حمایت <b>۱۳</b></span>
          </Link>
          <p>همراهی‌های کوچک، قدم‌هایی برای فردایی روشن‌تر.</p>
        </div>
        <div className="footer-links" aria-label="پیوندهای سایت">
          <Link to="/">صفحه اصلی</Link>
          <Link to="/donate">روش حمایت</Link>
          <a href="/#about">درباره ما</a>
          <Link to="/register">ساخت حساب نمایشی</Link>
        </div>
      </div>
      <div className="footer-disclaimer">
        <div className="container"><strong>نسخهٔ نمایشی:</strong> پرداخت واقعی و احراز هویت امن هنوز فعال نیست؛ اعداد و آمار نمونه‌اند.</div>
      </div>
      <div className="footer-bottom">© ۲۰۲۶ حمایت ۱۳ — تمامی حقوق محفوظ است.</div>
    </footer>
  );
}

export default Footer;
