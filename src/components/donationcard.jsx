import { Link } from "react-router-dom";

function DonationCard() {
  return (
    <article className="donation-card" aria-label="نمونه کمپین حمایت">
      <div className="campaign-topline">
        <span className="campaign-status"><span /> کمپین نمونه</span>
        <span className="campaign-number">۰۱۳ / ۰۱</span>
      </div>
      <div className="donation-icon" aria-hidden="true">✦</div>
      <h3>برای قدم بعدی کنار هم</h3>
      <p>حمایت جمعی می‌تواند راه یک ایدهٔ ارزشمند را هموارتر کند.</p>
      <div className="progress-info"><span>پیشرفت نمونه</span><strong>۶۵٪</strong></div>
      <div className="progress-bar" role="progressbar" aria-label="پیشرفت نمایشی کمپین" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"><div className="progress-value" /></div>
      <div className="progress-bottom"><span>۶,۵۰۰,۰۰۰ تومان جمع‌آوری‌شده</span><span>از ۱۰ میلیون</span></div>
      <Link to="/donate" className="primary-button full-button">مشاهده روش‌های حمایت <span aria-hidden="true">←</span></Link>
      <small className="card-demo-note">اطلاعات مالی این کارت واقعی نیست.</small>
    </article>
  );
}

export default DonationCard;
