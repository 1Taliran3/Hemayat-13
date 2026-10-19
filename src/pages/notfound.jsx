import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="not-found">

      <div>

        <span>
          404
        </span>

        <h1>
          صفحه پیدا نشد
        </h1>

        <p>
          آدرسی که وارد کردی وجود ندارد.
        </p>

        <Link
          to="/"
          className="primary-button"
        >
          بازگشت به خانه
        </Link>

      </div>

    </main>
  );
}

export default NotFound;