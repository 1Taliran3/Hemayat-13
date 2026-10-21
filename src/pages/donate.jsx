import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/+$/, "");

function Donate() {
  const [method, setMethod] = useState("rial");
  const [amount, setAmount] = useState("100000");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  const amounts = [50000, 100000, 250000, 500000];

  const handleDonation = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0 || numericAmount > 9999999999) {
      setNeedsLogin(false);
      setMessage("لطفاً مبلغی معتبر بین ۱ تا ۹٬۹۹۹٬۹۹۹٬۹۹۹ تومان وارد کنید.");
      return;
    }

    if (loading) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setNeedsLogin(true);
      setMessage("برای ثبت درخواست حمایت، ابتدا وارد حساب کاربری شوید.");
      return;
    }

    setLoading(true);
    setNeedsLogin(false);
    setMessage("در حال ثبت درخواست...");

    try {
      const response = await fetch(`${API_URL}/api/donation-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        setNeedsLogin(true);
        throw new Error(result?.message || "نشست ورود معتبر نیست. لطفاً دوباره وارد حساب شوید.");
      }

      if (response.status === 404) {
        throw new Error(result?.message || "مسیر ثبت درخواست در بک‌اند پیدا نشد. سرور را دوباره اجرا کنید.");
      }

      if (!response.ok || !result?.success || !result?.data?.id) {
        throw new Error(result?.message || `ثبت درخواست ناموفق بود (خطای ${response.status}).`);
      }

      setMessage(`درخواست با موفقیت ثبت شد. شماره پیگیری: ${result.data.id} — این ثبت درخواست به معنی پرداخت وجه نیست.`);
    } catch (requestError) {
      console.error("Donation request error:", requestError);
      setMessage(
        requestError instanceof TypeError
          ? "ارتباط با بک‌اند برقرار نشد. مطمئن شوید سرور اجراست و VITE_API_URL درست تنظیم شده است."
          : requestError.message || "ثبت درخواست انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="donate-page">
      <div className="container donate-container">
        <div className="donate-header">
          <span className="section-label">حمایت مالی</span>
          <h1>یک قدم برای همراهی</h1>
          <p>
            مبلغ دلخواهت را مشخص کن. این مرحله فقط درخواست حمایت را
            ثبت می‌کند و پرداخت واقعی انجام نمی‌شود.
          </p>
        </div>

        <div className="donate-box">
          <div className="method-tabs" role="tablist" aria-label="روش حمایت">
            <button
              type="button"
              role="tab"
              aria-selected={method === "rial"}
              className={method === "rial" ? "method-tab active" : "method-tab"}
              onClick={() => { setMethod("rial"); setMessage(""); setNeedsLogin(false); }}
            >پرداخت ریالی</button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "crypto"}
              className={method === "crypto" ? "method-tab active" : "method-tab"}
              onClick={() => { setMethod("crypto"); setMessage(""); setNeedsLogin(false); }}
            >ارز دیجیتال</button>
          </div>

          {method === "rial" ? (
            <form onSubmit={handleDonation}>
              <label htmlFor="donation-amount">مبلغ حمایت</label>
              <div className="amount-grid">
                {amounts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={Number(amount) === item ? "amount-button selected" : "amount-button"}
                    onClick={() => { setAmount(String(item)); setMessage(""); setNeedsLogin(false); }}
                  >{item.toLocaleString("fa-IR")}</button>
                ))}
              </div>

              <label htmlFor="donation-amount">مبلغ دلخواه</label>
              <div className="amount-input-wrapper">
                <input
                  id="donation-amount"
                  type="number"
                  min="1"
                  max="9999999999"
                  step="1"
                  required
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => { setAmount(event.target.value); setMessage(""); setNeedsLogin(false); }}
                />
                <span>تومان</span>
              </div>

              <div className="donation-summary">
                <span>مبلغ انتخاب‌شده</span>
                <strong>{Number(amount || 0).toLocaleString("fa-IR")} تومان</strong>
              </div>

              {message && <p className="form-message" role="status">{message}</p>}
              {needsLogin && <p className="auth-footer"><Link to="/login">ورود به حساب کاربری</Link> یا <Link to="/register">ساخت حساب</Link></p>}

              <button type="submit" className="primary-button full-button" disabled={loading}>
                {loading ? "در حال ثبت..." : "ثبت درخواست حمایت"}
                <span aria-hidden="true"> ←</span>
              </button>
              <p className="payment-disclaimer">ثبت این درخواست پرداخت بانکی نیست و پولی جابه‌جا نمی‌شود.</p>
            </form>
          ) : (
            <div className="crypto-payment">
              <div className="crypto-big-icon" aria-hidden="true">₿</div>
              <h2>پرداخت با ارز دیجیتال</h2>
              <p>پرداخت با ارزهای دیجیتال مانند USDT، BTC و ETH هنوز فعال نشده است.</p>
              <div className="crypto-coming">
                این روش در نسخهٔ نمایشی غیرفعال است. فعال‌سازی آن به زیرساخت پرداخت امن و بررسی‌های لازم نیاز دارد.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Donate;
