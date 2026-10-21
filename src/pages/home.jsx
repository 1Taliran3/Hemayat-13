import { useState } from "react";
import { Link } from "react-router-dom";
import DonationCard from "../components/donationcard.jsx";
import heroEmblem from "../assets/hero-emblem.svg";

const faqs = [
  { question: "آیا پرداخت در این نسخه واقعی است؟", answer: "خیر. این نسخه برای نمایش رابط کاربری است و به درگاه پرداخت یا سرور مالی متصل نیست. تا زمان پیاده‌سازی و آزمایش زیرساخت امن، هیچ پرداخت واقعی انجام نمی‌شود." },
  { question: "چطور می‌توانم سایت را برای دیگران بفرستم؟", answer: "پس از انتشار روی یک سرویس میزبانی، یک لینک عمومی دریافت می‌کنی. آدرس localhost فقط برای همان کامپیوتر است؛ در حال حاضر این پروژه هنوز منتشر نشده است." },
  { question: "آیا ساخت حساب و ورود امن هستند؟", answer: "خیر. فرم‌های ورود و ثبت‌نام فعلاً نمایشی‌اند و دادهٔ ساده‌ای را در مرورگر ذخیره می‌کنند. برای حساب واقعی، سرور، هش‌کردن رمز عبور، مدیریت نشست و کنترل‌های امنیتی لازم است." },
];

function Home() {
  const [shareMessage, setShareMessage] = useState("");

  const handleShare = async () => {
    const url = `${window.location.origin}/donate`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "حمایت ۱۳", text: "با مسیر حمایت ۱۳ آشنا شو", url });
        setShareMessage("پیوند برای اشتراک‌گذاری آماده شد.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage("پیوند صفحهٔ حمایت کپی شد.");
      } else {
        setShareMessage(`برای اشتراک‌گذاری، این آدرس را کپی کن: ${url}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareMessage(`آدرس صفحهٔ حمایت: ${url}`);
    }
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-ambient hero-ambient-one" />
        <div className="hero-ambient hero-ambient-two" />
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="eyebrow"><span className="eyebrow-line" /> حمایت ۱۳ <span className="eyebrow-separator">/</span> همراهی برای آینده</div>
            <h1>تغییرهای بزرگ،<br /><span className="gradient-text">با یک همراهی</span><br />شروع می‌شوند.</h1>
            <p className="hero-text">ما به قدرت قدم‌های کوچک باور داریم. حمایت ۱۳ فضایی ساده و روشن برای نزدیک‌تر شدن به ایده‌هایی است که ارزش ادامه دادن دارند.</p>
            <div className="hero-buttons">
              <Link to="/donate" className="primary-button">راه‌های حمایت <span aria-hidden="true">↖</span></Link>
              <a href="#about" className="secondary-button">با مسیر ما آشنا شو <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-trust" aria-label="ویژگی‌های طراحی">
              <span><b>۰۱</b> شفافیت در مسیر</span>
              <span><b>۰۲</b> تجربه ساده</span>
              <span><b>۰۳</b> همراهی جمعی</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-frame"><img className="hero-emblem" src={heroEmblem} alt="نشان طلایی ۱۳ در قاب مشکی" /></div>
            <div className="visual-caption"><span className="visual-caption-mark">13</span><div><strong>یک قدم، یک معنا</strong><small>هر همراهی ارزشمند است</small></div><span className="caption-star" aria-hidden="true">✦</span></div>
            <DonationCard />
          </div>
        </div>
        <div className="container">
          <div className="stats" aria-label="نمونه آمار نمایشی">
            <div className="stat"><strong>۱۳</strong><span>نشانی از همراهی</span></div>
            <div className="stat"><strong>۶۵٪</strong><span>پیشرفت نمونه کمپین</span></div>
            <div className="stat"><strong>۰۱</strong><span>قدم برای شروع</span></div>
            <div className="stat"><strong>همراه هم</strong><span>نگاه به آینده</span></div>
          </div>
          <p className="sample-data-note">آمارها و ارقام بالا صرفاً نمونهٔ طراحی هستند و از پایگاه داده یا پرداخت واقعی دریافت نمی‌شوند.</p>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="container about-grid">
          <div className="about-heading-block">
            <span className="section-label"><i /> داستان ما</span>
            <h2>حمایت، فقط یک مبلغ نیست؛<br /><span className="text-gold">اعتماد به یک مسیر است.</span></h2>
            <div className="section-index">۱۳ <span>—</span> ۰۱</div>
          </div>
          <div className="about-copy">
            <p>حمایت ۱۳ با یک ایده ساده شکل گرفته: مسیر همراهی باید روشن، قابل فهم و محترمانه باشد. هر فرد باید بتواند بدون پیچیدگی با هدف یک پروژه آشنا شود و درباره قدم بعدی تصمیم بگیرد.</p>
            <p>این نسخه، نمونهٔ اولیهٔ تجربه کاربری است. پیش از پذیرش حمایت واقعی، اطلاعات مالی، روش گزارش‌دهی و سازوکار پاسخ‌گویی باید به‌صورت مستقل و شفاف تکمیل شوند.</p>
            <Link to="/donate" className="text-link">آشنایی با روش حمایت <span aria-hidden="true">←</span></Link>
          </div>
        </div>
      </section>

      <section className="support-section" id="how-to-help">
        <div className="container">
          <div className="section-heading">
            <span className="section-label"><i /> مسیر همراهی</span>
            <h2>شروع، ساده است.</h2>
            <p>سه قدم روشن برای آشنایی با مسیر حمایت؛ بدون وعده‌های مبهم.</p>
          </div>
          <div className="support-grid">
            <article className="support-card"><span className="support-card-index">۰۱</span><div className="support-icon" aria-hidden="true">⌕</div><h3>آشنا شو</h3><p>هدف، توضیحات و اطلاعات موجود را بخوان و پرسش‌هایت را روشن کن.</p><span className="support-card-rule" /></article>
            <article className="support-card"><span className="support-card-index">۰۲</span><div className="support-icon" aria-hidden="true">✳</div><h3>راهت را انتخاب کن</h3><p>روش همراهی متناسب با خودت را بررسی کن. این نسخه پرداخت واقعی انجام نمی‌دهد.</p><span className="support-card-rule" /></article>
            <article className="support-card"><span className="support-card-index">۰۳</span><div className="support-icon" aria-hidden="true">↗</div><h3>پیام را برسان</h3><p>مسیر را با دیگران به اشتراک بگذار تا افراد بیشتری با ایده آشنا شوند.</p><button className="text-link share-button" type="button" onClick={handleShare}>اشتراک‌گذاری پیوند <span aria-hidden="true">←</span></button>{shareMessage && <p className="share-message" role="status">{shareMessage}</p>}</article>
          </div>
        </div>
      </section>

      <section className="transparency-section">
        <div className="container transparency-panel">
          <div className="transparency-mark" aria-hidden="true">13</div>
          <div><span className="section-label"><i /> اصل ما</span><h2>اعتماد، با شفافیت ساخته می‌شود.</h2><p>قبل از آغاز هر پرداخت واقعی، هدف جمع‌آوری، مسئولیت‌ها، هزینه‌ها و گزارش استفاده از منابع باید مشخص باشد.</p></div>
          <div className="transparency-stamp"><span>شفافیت</span><strong>اول</strong><small>همیشه</small></div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="container faq-layout">
          <div><span className="section-label"><i /> پرسش‌های رایج</span><h2>پاسخ روشن،<br /><span className="text-gold">بخشی از اعتماد است.</span></h2><p>وضعیت فعلی این نسخه را بدون ابهام توضیح می‌دهیم.</p></div>
          <div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden="true">＋</span></summary><p>{faq.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta"><div><span className="section-label"><i /> قدم بعدی</span><h2>از آشنایی تا همراهی،<br /><span className="text-gold">یک قدم فاصله است.</span></h2><p>با مسیر حمایت ۱۳ آشنا شو و نسخه آزمایشی را بررسی کن.</p></div><div className="cta-actions"><Link to="/donate" className="primary-button">دیدن روش‌های حمایت <span aria-hidden="true">↖</span></Link><Link to="/register" className="secondary-button">ساخت حساب</Link></div></div>
      </section>
    </main>
  );
}

export default Home;
