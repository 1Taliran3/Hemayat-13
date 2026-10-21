import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    closeMenu();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo" aria-label="حمایت ۱۳، صفحه اصلی" onClick={closeMenu}>
          <img className="logo-icon" src="/brand-13.svg" alt="" />
          <span className="logo-wordmark"><strong>حمایت <b>۱۳</b></strong><small>همراهی برای آینده</small></span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <nav id="main-navigation" className={`nav-links${menuOpen ? " nav-links-open" : ""}`} aria-label="ناوبری اصلی">
          <Link to="/" onClick={closeMenu}>خانه</Link>
          <a href="/#about" onClick={closeMenu}>داستان ما</a>
          <a href="/#how-to-help" onClick={closeMenu}>روش حمایت</a>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" onClick={closeMenu}>پنل کاربری</Link>
              <button type="button" className="nav-logout" onClick={handleLogout}>خروج</button>
            </>
          ) : (
            <Link to="/login" className="nav-login" onClick={closeMenu}>ورود</Link>
          )}
          <Link to="/donate" className="nav-register" onClick={closeMenu}>حمایت از مسیر <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
