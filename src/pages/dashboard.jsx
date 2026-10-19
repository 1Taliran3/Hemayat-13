import { Link } from "react-router-dom";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    const parsed = storedUser ? JSON.parse(storedUser) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function Dashboard() {
  const user = readStoredUser();

  return (
    <main className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">پنل کاربری</span>
            <h1>سلام {user.name || "دوست عزیز"} 👋</h1>
            <p>اینجا می‌توانی وضعیت حمایت‌های خودت را ببینی.</p>
          </div>
          <Link to="/donate" className="primary-button">حمایت جدید</Link>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stat"><span>کل حمایت‌ها</span><strong>۰</strong><small>مورد</small></div>
          <div className="dashboard-stat"><span>مجموع حمایت</span><strong>۰</strong><small>تومان</small></div>
          <div className="dashboard-stat"><span>وضعیت حساب</span><strong>فعال</strong><small>حساب نمایشی</small></div>
        </div>

        <div className="history-card">
          <div className="history-header">
            <h2>تاریخچه حمایت‌ها</h2>
            <span>آخرین فعالیت‌ها</span>
          </div>
          <div className="empty-history">
            <div className="empty-icon" aria-hidden="true">✦</div>
            <h3>هنوز حمایتی ثبت نشده</h3>
            <p>اولین حمایت خودت را ثبت کن.</p>
            <Link to="/donate" className="secondary-button">حمایت مالی</Link>
          </div>
        </div>
        <p className="sample-data-note">این داشبورد نمایشی است؛ اطلاعات حساب و سوابق حمایت هنوز در سرور ذخیره نمی‌شوند.</p>
      </div>
    </main>
  );
}

export default Dashboard;
