import '../homeStyles.css';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  TrendingUp,
  BarChart3,
  BriefcaseBusiness,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="portal-home">
      <header className="portal-header">
         <div className="portal-brand">
  <Link to="/" className="logo-link">
    <img
      src="/logo.png"
      alt="Sudarshini Logo"
      className="portal-logo"
    />
  </Link>

  <div>
    <h1>Sudarshini Business Portal</h1>
    <p>Smart dashboard for your business growth</p>
  </div>
</div>

        <button
          className="login-btn"
          onClick={() => navigate('/login')}
          title="Login"
          type="button"
        >
          <LogIn size={18} />
          <span>Login</span>
        </button>
      </header>

      <main className="portal-hero">
        <div className="hero-content">
          <span className="hero-badge">Business Growth Platform</span>
          <h2>Manage, Monitor & Grow Your Business with Confidence</h2>
          <p>
            Track orders, customers, VIP performance, sales reports, and smart
            business insights from one professional portal.
          </p>

          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={() => navigate('/login')}
              type="button"
            >
              <LogIn size={18} />
              Go to Login
            </button>
          </div>
        </div>

        <div className="hero-animation">
          <div className="float-card card-1">
            <TrendingUp size={26} />
            <div>
              <strong>Sales Growth</strong>
              <span>+24% this month</span>
            </div>
          </div>

          <div className="float-card card-2">
            <BarChart3 size={26} />
            <div>
              <strong>Analytics</strong>
              <span>Live business reports</span>
            </div>
          </div>

          <div className="float-card card-3">
            <BriefcaseBusiness size={26} />
            <div>
              <strong>Operations</strong>
              <span>All systems in one place</span>
            </div>
          </div>

          <div className="hero-circle hero-circle-1" />
          <div className="hero-circle hero-circle-2" />
          <div className="hero-circle hero-circle-3" />
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-logos">
          <img src="/footer1.png" alt="Business Logo 1" className="footer-logo bounce-1" />
          <img src="/footer2.png" alt="Business Logo 2" className="footer-logo bounce-2" />
          <img src="/footer3.png" alt="Business Logo 3" className="footer-logo bounce-3" />
          <img src="/footer4.png" alt="Business Logo 4" className="footer-logo bounce-4" />
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} TTouch Clothing (IT Department)
        </div>
      </footer>
    </div>
  );
}