import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ClarixLogo from "../common/ClarixLogo";
import "../../styles/Navbar.css";

const NAV_LINKS = [
  { label: "Features", to: "/features" },
  { label: "Pricing",  to: "/pricing"  },
  { label: "Docs",     to: "/docs"     },
  { label: "Blog",     to: "/blog"     },
  { label: "Contact", to: "/contact"},
];

function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar-inner">

        {/* Left — Logo + Links */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <ClarixLogo dark={false} size="md" />
          </Link>

          <nav className="navbar-links">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`navbar-link ${location.pathname === to ? "navbar-link--active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right — CTA */}
        <div className="navbar-right">
          <Link to="/login" className="navbar-signin">Contact Us</Link>
          <Link to="/app" className="navbar-cta">
            Try Clarix
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{transform: "translateY(-1px) rotate(-45deg)"}}>
              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar-drawer ${menuOpen ? "navbar-drawer--open" : ""}`}>
        {NAV_LINKS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className={`drawer-link ${location.pathname === to ? "drawer-link--active" : ""}`}
          >
            {label}
          </Link>
        ))}
        <div className="drawer-divider" />
        <Link to="/login"  className="drawer-link">Sign in</Link>
        <Link to="/app" className="drawer-cta">Try Clarix →</Link>
      </div>
    </header>
  );
}

export default Navbar;