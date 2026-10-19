import { useState } from "react";

function Donate() {
  const [method, setMethod] = useState("rial");
  const [amount, setAmount] = useState("100000");
  const [message, setMessage] = useState("");
  const amounts = [50000, 100000, 250000, 500000];

  const handleDonation = (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      setMessage("لطفاً مبلغی معتبر و بزرگ‌تر از صفر وارد کنید.");
      return;
    }

    setMessage(`مبلغ ${numericAmount.toLocaleString("fa-IR")} تومان انتخاب شد؛ پرداخت واقعی هنوز به درگاه بانکی متصل نیست.`);
  };

  return (
    <main className="donate-page">
      <div className="container donate-container">
        <div className="donate-header">
          <span className="section-label">حمایت مالی</span>
          <h1>یک قدم برای همراهی</h1>
          <p>مبلغ دلخواهت را مشخص کن. در این نسخه، هیچ تراکنش مالی انجام نمی‌شود.</p>
        </div>

        <div className="donate-box">
          <div className="method-tabs" role="tablist" aria-label="روش حمایت">
            <button type="button" role="tab" aria-selected={method === "rial"} className={method === "rial" ? "method-tab active" : "method-tab"} onClick={() => { setMethod("rial"); setMessage(""); }}>پرداخت ریالی</button>
            <button type="button" role="tab" aria-selected={method === "crypto"} className={method === "crypto" ? "method-tab active" : "method-tab"} onClick={() => { setMethod("crypto"); setMessage(""); }}>ارز دیجیتال</button>
          </div>

          {method === "rial" ? (
            <form onSubmit={handleDonation}>
              <label htmlFor="donation-amount">مبلغ حمایت</label>
              <div className="amount-grid">
                {amounts.map((item) => (
                  <button key={item} type="button" className={Number(amount) === item ? "amount-button selected" : "amount-button"} onClick={() => { setAmount(String(item)); setMessage(""); }}>
                    {item.toLocaleString("fa-IR")}
                  </button>
                ))}
              </div>

              <label htmlFor="donation-amount">مبلغ دلخواه</label>
              <div className="amount-input-wrapper">
                <input id="donation-amount" type="number" min="1" step="1" required inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(""); }} />
                <span>تومان</span>
              </div>

              <div className="donation-summary">
                <span>مبلغ انتخاب‌شده</span>
                <strong>{Number(amount || 0).toLocaleString("fa-IR")} تومان</strong>
              </div>
              {message && <p className="form-message" role="status">{message}</p>}
              <button type="submit" className="primary-button full-button">ثبت انتخاب نمایشی <span aria-hidden="true">←</span></button>
              <p className="payment-disclaimer">این فرم فقط انتخاب مبلغ را در همین صفحه نمایش می‌دهد؛ به درگاه بانکی متصل نیست و پولی جابه‌جا نمی‌کند.</p>
            </form>
          ) : (
            <div className="crypto-payment">
              <div className="crypto-big-icon" aria-hidden="true">₿</div>
              <h2>پرداخت با ارز دیجیتال</h2>
              <p>پرداخت با ارزهای دیجیتال مانند USDT، BTC و ETH هنوز فعال نشده است.</p>
              <div className="crypto-coming">این روش در نسخهٔ نمایشی غیرفعال است. فعال‌سازی آن به زیرساخت پرداخت امن، بررسی حقوقی و پشتیبانی فنی نیاز دارد.</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Donate;
