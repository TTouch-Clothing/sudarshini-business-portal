import '../homeStyles.css';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cartoonState, setCartoonState] = useState('normal');

  const { login } = useAuth();
  const navigate = useNavigate();

  const cartoonImage =
    cartoonState === 'cover'
      ? '/cartoon-cover.png'
      : cartoonState === 'open'
      ? '/cartoon-open.png'
      : '/cartoon-normal.png';

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordFocus() {
    if (!show) setCartoonState('cover');
  }

  function handlePasswordBlur() {
    if (!show) setCartoonState('normal');
  }

  function handleEmailFocus() {
    setCartoonState('normal');
  }

  function togglePassword() {
    const nextShow = !show;
    setShow(nextShow);
    setCartoonState(nextShow ? 'open' : 'cover');
  }

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
      </header>

      <main className="login-main">
        <div className="login-stage">
          <img
            src={cartoonImage}
            alt="Login Cartoon"
            className="login-cartoon"
          />

          <form
            className="login-card"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <h1>Sudarshini Dashboard</h1>

            <label>Email</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleEmailFocus}
                autoComplete="off"
              />
            </div>

            <label>Password</label>
            <div className="input-wrap">
              <Lock size={18} />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={togglePassword}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>

      <footer className="portal-footer">
        <div className="footer-logos">
          <img src="/footer1.png" alt="Logo 1" className="footer-logo bounce-1" />
          <img src="/footer2.png" alt="Logo 2" className="footer-logo bounce-2" />
          <img src="/footer3.png" alt="Logo 3" className="footer-logo bounce-3" />
          <img src="/footer4.png" alt="Logo 4" className="footer-logo bounce-4" />
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} TTouch Clothing (IT Department)
        </div>
      </footer>
    </div>
  );
}