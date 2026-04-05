import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI';

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, fileName = 'profile.jpg') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.95
    );
  });
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.image || '');
  const [loading, setLoading] = useState(false);
  const [existingImageRemoved, setExistingImageRemoved] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPreview(user?.image || '');
    setExistingImageRemoved(false);
  }, [user]);

  useEffect(() => {
    if (!image) {
      if (existingImageRemoved) {
        setPreview('');
      } else {
        setPreview(user?.image || '');
      }
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image, user, existingImageRemoved]);

  const fileName = useMemo(() => image?.name || 'No file selected', [image]);

  function onCropComplete(_, croppedPixels) {
    setCroppedAreaPixels(croppedPixels);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCropSource(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);

    e.target.value = '';
  }

  async function handleCropSave() {
    try {
      if (!cropSource || !croppedAreaPixels) return;

      const croppedFile = await getCroppedImg(
        cropSource,
        croppedAreaPixels,
        `profile-${Date.now()}.jpg`
      );

      setImage(croppedFile);
      setExistingImageRemoved(false);
      setCropModalOpen(false);
      URL.revokeObjectURL(cropSource);
      setCropSource('');
    } catch {
      toast.error('Failed to crop image');
    }
  }

  function handleCropCancel() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropModalOpen(false);
    setCropSource('');
  }

  function removeSelectedImage() {
    setImage(null);
    setPreview('');
    setExistingImageRemoved(true);
  }

  async function save(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);

      if (image) {
        fd.append('image', image);
      } else if (existingImageRemoved) {
        fd.append('removeImage', 'true');
      }

      const { data } = await http.put('/auth/change-profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(data.user);
      setImage(null);
      setPreview(data.user?.image || '');
      setExistingImageRemoved(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="profile-page">
        <Card>
          <div className="profile-wrap">
            <h2 className="profile-title">Change Profile</h2>

            <form className="profile-form" onSubmit={save}>
              <div className="profile-image-row">
                <div className="profile-preview-wrap">
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

                  {preview && (
                    <button
                      type="button"
                      className="image-top-remove-btn"
                      onClick={removeSelectedImage}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
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

      {cropModalOpen && (
        <div className="admin-modal-overlay">
          <div className="crop-modal-box">
            <button
              type="button"
              className="admin-modal-close"
              onClick={handleCropCancel}
            >
              <X size={18} />
            </button>

            <h3 className="admin-modal-title">Crop Image</h3>

            <div className="cropper-wrap">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="crop-controls">
              <label>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <div className="crop-actions">
              <button
                type="button"
                className="admin-user-cancel-btn"
                onClick={handleCropCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleCropSave}
              >
                Crop & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}