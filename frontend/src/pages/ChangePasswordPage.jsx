import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import http from '../api/http';
import { Card } from '../components/UI';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  async function save(e) {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);

      await http.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      toast.success('Password updated');

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setShow({
        current: false,
        next: false,
        confirm: false,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="change-password-page">
      <Card>
        <div className="change-password-wrap">
          <h2 className="change-password-title">Change Password</h2>

          <form className="change-password-form" onSubmit={save}>
            <div className="change-password-field">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="input-wrap change-password-input">
                <input
                  id="currentPassword"
                  type={show.current ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) =>
                    setForm({ ...form, currentPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShow((prev) => ({ ...prev, current: !prev.current }))
                  }
                  aria-label={show.current ? 'Hide current password' : 'Show current password'}
                >
                  {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="change-password-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrap change-password-input">
                <input
                  id="newPassword"
                  type={show.next ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShow((prev) => ({ ...prev, next: !prev.next }))
                  }
                  aria-label={show.next ? 'Hide new password' : 'Show new password'}
                >
                  {show.next ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="change-password-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap change-password-input">
                <input
                  id="confirmPassword"
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShow((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                  aria-label={show.confirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn change-password-btn"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}