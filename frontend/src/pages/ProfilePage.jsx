import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI';

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.image || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPreview(user?.image || '');
  }, [user]);

  useEffect(() => {
    if (!image) return;

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const fileName = useMemo(() => image?.name || 'No file selected', [image]);

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImage(file);
  }

  function removeSelectedImage() {
    setImage(null);
    setPreview(user?.image || '');
  }

  async function save(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      if (image) fd.append('image', image);

      const { data } = await http.put('/auth/change-profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(data.user);
      setImage(null);
      setPreview(data.user?.image || '');
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <Card>
        <div className="profile-wrap">
          <h2 className="profile-title">Change Profile</h2>

          <form className="profile-form" onSubmit={save}>
            <div className="profile-image-row">
              <div className="profile-preview-box">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="profile-preview-image"
                  />
                ) : (
                  <span className="profile-no-image">No Image</span>
                )}
              </div>

              <div className="profile-upload-area">
                <label className="profile-label" htmlFor="profile-image">
                  Profile Image
                </label>

                <div className="profile-upload-actions">
                  <label htmlFor="profile-image" className="profile-file-btn">
                    Choose File
                  </label>

                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />

                  {image && (
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="profile-remove-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="profile-file-name">{fileName}</div>
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="profile-input"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="profile-input"
              />
            </div>

            <button
              type="submit"
              className="primary-btn profile-save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}