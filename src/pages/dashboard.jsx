import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/+$/, "");

const STATUS_LABELS = {
  pending: "در انتظار بررسی",
  approved: "تأیید درخواست",
  rejected: "رد درخواست",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("token");

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      handleUnauthorized();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileResponse, requestsResponse] = await Promise.all([
        fetch(`${API_URL}/api/auth/me`, { headers }),
        fetch(`${API_URL}/api/donation-requests`, { headers }),
      ]);

      if (profileResponse.status === 401 || requestsResponse.status === 401) {
        handleUnauthorized();
        return;
      }

      const [profileType, requestsType] = [
        profileResponse.headers.get("content-type") || "",
        requestsResponse.headers.get("content-type") || "",
      ];

      if (!profileType.includes("application/json") || !requestsType.includes("application/json")) {
        throw new Error("پاسخ بک‌اند قابل‌خواندن نیست. مطمئن شوید سرور صحیح اجرا شده است.");
      }

      const [profileResult, requestsResult] = await Promise.all([
        profileResponse.json(),
        requestsResponse.json(),
      ]);

      if (!profileResponse.ok || !profileResult.success || !profileResult.user) {
        throw new Error(profileResult.message || "دریافت اطلاعات حساب انجام نشد.");
      }
      if (!requestsResponse.ok || !requestsResult.success || !Array.isArray(requestsResult.data)) {
        throw new Error(requestsResult.message || "دریافت سوابق حمایت انجام نشد.");
      }

      setUser(profileResult.user);
      setRequests(requestsResult.data);
      localStorage.setItem("user", JSON.stringify(profileResult.user));
      localStorage.setItem("isLoggedIn", "true");
    } catch (requestError) {
      console.error("Dashboard load failed:", requestError);
      setError(
        requestError instanceof TypeError
          ? "ارتباط با بک‌اند برقرار نشد. سرور و آدرس API را بررسی کنید."
          : requestError.message || "دریافت اطلاعات انجام نشد."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalRequested = useMemo(
    () => requests.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [requests]
  );

  const updateStatus = async (requestId, status) => {
    if (!token || updatingId !== null) return;
    setUpdatingId(requestId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/donation-requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : null;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `تغییر وضعیت انجام نشد (${response.status}).`);
      }

      setRequests((current) => current.map((item) =>
        String(item.id) === String(requestId) ? { ...item, status: result.data.status } : item
      ));
      setNotice(`وضعیت درخواست شماره ${requestId} به‌روزرسانی شد.`);
    } catch (requestError) {
      console.error("Updating donation request failed:", requestError);
      setError(requestError.message || "تغییر وضعیت درخواست انجام نشد.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">{user.role === "admin" ? "پنل مدیریت" : "پنل کاربری"}</span>
            <h1>سلام {user.name || "دوست عزیز"} 👋</h1>
            <p>{user.role === "admin" ? "درخواست‌های ثبت‌شده را بررسی و مدیریت کن." : "در این بخش اطلاعات حساب و سوابق درخواست‌های حمایتت را می‌بینی."}</p>
          </div>
          {user.role !== "admin" && <Link to="/donate" className="primary-button">ثبت درخواست حمایت</Link>}
        </div>

        {error && (
          <div className="dashboard-alert" role="alert">
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={loadDashboard} disabled={loading}>
              تلاش دوباره
            </button>
          </div>
        )}
        {notice && <p className="dashboard-notice" role="status">{notice}</p>}

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>{user.role === "admin" ? "تعداد درخواست‌ها" : "تعداد درخواست‌های من"}</span>
            <strong>{loading ? "…" : requests.length.toLocaleString("fa-IR")}</strong>
            <small>مورد ثبت‌شده</small>
          </div>
          <div className="dashboard-stat">
            <span>مجموع مبالغ درخواستی</span>
            <strong>{loading ? "…" : totalRequested.toLocaleString("fa-IR")}</strong>
            <small>تومان؛ نه مبلغ پرداخت‌شده</small>
          </div>
          <div className="dashboard-stat">
            <span>وضعیت حساب</span>
            <strong>{user.role === "admin" ? "مدیر" : "فعال"}</strong>
            <small>{user.email || "حساب کاربری"}</small>
          </div>
        </div>

        <section className="history-card" aria-labelledby="request-history-title">
          <div className="history-header">
            <h2 id="request-history-title">{user.role === "admin" ? "همه درخواست‌های حمایت" : "تاریخچه درخواست‌های حمایت"}</h2>
            <span>{user.role === "admin" ? "مدیریت درخواست‌ها" : "اطلاعات دریافت‌شده از سرور"}</span>
          </div>

          {loading ? (
            <div className="empty-history"><p>در حال دریافت اطلاعات از سرور…</p></div>
          ) : requests.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon" aria-hidden="true">✦</div>
              <h3>هنوز درخواستی ثبت نشده</h3>
              <p>{user.role === "admin" ? "در حال حاضر درخواستی برای نمایش وجود ندارد." : "اولین درخواست حمایت خودت را ثبت کن."}</p>
              {user.role !== "admin" && <Link to="/donate" className="secondary-button">ثبت درخواست حمایت</Link>}
            </div>
          ) : (
            <div className="request-list">
              {requests.map((item) => (
                <article className="request-row" key={item.id}>
                  <div className="request-main">
                    <strong>درخواست شماره {String(item.id).toLocaleString("fa-IR")}</strong>
                    <span>{formatDate(item.created_at)}</span>
                    {user.role === "admin" && item.user_id && <small>شناسه کاربر: {String(item.user_id).toLocaleString("fa-IR")}</small>}
                  </div>
                  <div className="request-amount">
                    <strong>{Number(item.amount || 0).toLocaleString("fa-IR")} تومان</strong>
                    <span>مبلغ درخواستی</span>
                  </div>
                  <span className={`request-status status-${item.status || "pending"}`}>
                    {STATUS_LABELS[item.status] || item.status || STATUS_LABELS.pending}
                  </span>
                  {user.role === "admin" && (
                    <label className="request-status-control">
                      <span>تغییر وضعیت</span>
                      <select
                        value={item.status || "pending"}
                        disabled={updatingId !== null}
                        onChange={(event) => updateStatus(item.id, event.target.value)}
                        aria-label={`تغییر وضعیت درخواست ${item.id}`}
                      >
                        <option value="pending">در انتظار بررسی</option>
                        <option value="approved">تأیید درخواست</option>
                        <option value="rejected">رد درخواست</option>
                      </select>
                    </label>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="sample-data-note">
          مبالغ بالا مبلغ درخواست‌شده هستند؛ چون درگاه پرداخت متصل نیست، به معنی دریافت یا پرداخت واقعی وجه نیستند.
        </p>
      </div>
    </main>
  );
}

export default Dashboard;
