import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2,
  Eye,
  EyeOff,
  Search,
  Plus,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import http from '../api/http';
import { Card, LoadingBlock } from '../components/UI';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'ADMIN',
  image: null
};

const initialEditForm = {
  name: '',
  email: '',
  role: 'ADMIN',
  image: null
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [search, setSearch] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editImagePreview, setEditImagePreview] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    try {
      const r = await http.get('/admins');
      setRows(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.image) {
      setImagePreview('');
      return;
    }

    const url = URL.createObjectURL(form.image);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  useEffect(() => {
    if (!editForm.image) {
      if (!editUser?.image) setEditImagePreview('');
      return;
    }

    const url = URL.createObjectURL(editForm.image);
    setEditImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [editForm.image, editUser]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const name = r.name?.toLowerCase() || '';
      const email = r.email?.toLowerCase() || '';
      return name.includes(q) || email.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  function closeCreateModal() {
    setShowCreateForm(false);
    setForm(initialForm);
    setImagePreview('');
    setShowPassword(false);
  }

  function closeEditModal() {
    setEditUser(null);
    setEditForm(initialEditForm);
    setEditImagePreview('');
  }

  async function add(e) {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('password', form.password);
      fd.append('role', form.role);
      if (form.image) fd.append('image', form.image);

      await http.post('/admins', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Admin/Employee added');
      closeCreateModal();
      await load();
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN',
      image: null
    });
    setEditImagePreview(user.image || '');
  }

  async function updateUser(e) {
    e.preventDefault();

    if (!editUser?._id) return;

    if (!editForm.name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('name', editForm.name);
      fd.append('email', editForm.email);
      fd.append('role', editForm.role);
      if (editForm.image) fd.append('image', editForm.image);

      await http.put(`/admins/${editUser._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('User updated');
      closeEditModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    try {
      setLoading(true);
      await http.delete(`/admins/${id}`);
      toast.success('User removed');
      setDeleteId(null);
      await load();

      const newTotal = Math.max(1, Math.ceil((filteredRows.length - 1) / pageSize));
      if (page > newTotal) setPage(newTotal);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  }

  if (!rows) return <LoadingBlock lines={6} />;

  return (
    <>
      <div className="admin-users-page">
        <div className="admin-users-toolbar">
          <div className="admin-users-search">
            <Search size={18} className="admin-users-search-icon" />

            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-users-search-input"
            />

            {search && (
              <button
                type="button"
                className="admin-users-search-clear"
                onClick={() => setSearch('')}
                title="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className="primary-btn admin-users-add-btn"
            type="button"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={18} />
            <span>Add Admin/Employee</span>
          </button>
        </div>

        <Card title="Admin / Employee List">
          <div className="admin-users-table-wrap">
            <table className="table admin-users-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length ? (
                  paginatedRows.map((r) => (
                    <tr key={r._id}>
                      <td>
                        {r.image ? (
                          <img
                            src={r.image}
                            alt={r.name}
                            className="admin-users-avatar"
                          />
                        ) : (
                          <div className="admin-users-avatar admin-users-avatar-empty">
                            {r.name?.[0] || 'U'}
                          </div>
                        )}
                      </td>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.role}</td>
                      <td>
                        <div className="admin-users-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setViewUser(r)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEdit(r)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => setDeleteId(r._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center muted">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRows.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 16,
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <button
                className="icon-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Previous"
                type="button"
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ minWidth: 90, textAlign: 'center', fontWeight: 700 }}>
                {page} / {totalPages}
              </div>

              <button
                className="icon-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Next"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </Card>
      </div>

      {showCreateForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box admin-create-modal">
            <button
              type="button"
              className="admin-modal-close"
              onClick={closeCreateModal}
            >
              <X size={18} />
            </button>

            <h3 className="admin-modal-title">Add Admin / Employee</h3>

            <form className="admin-user-form" onSubmit={add}>
              <div className="admin-user-form-field">
                <label>Name</label>
                <input
                  className="form-input"
                  placeholder="Enter name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="admin-user-form-field">
                <label>Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="admin-user-form-field">
                <label>Role</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>

              <div className="admin-user-form-field">
                <label>Password</label>
                <div className="input-wrap">
                  <input
                    className="form-input"
                    placeholder="Enter password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="admin-user-form-field">
                <label>Confirm Password</label>
                <div className="input-wrap">
                  <input
                    className="form-input"
                    placeholder="Confirm password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="admin-user-form-field">
                <label>Profile Photo</label>
                <div className="admin-user-file-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.files?.[0] || null })
                    }
                  />
                </div>
              </div>

              {imagePreview && (
                <div className="admin-user-image-preview-wrap">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="admin-user-image-preview"
                  />
                </div>
              )}

              <button className="primary-btn admin-save-full-btn" disabled={loading}>
                {loading ? 'Creating...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setViewUser(null)}
            >
              <X size={18} />
            </button>

            <div className="admin-view-user">
              {viewUser.image ? (
                <img
                  src={viewUser.image}
                  alt={viewUser.name}
                  className="admin-view-user-image"
                />
              ) : (
                <div className="admin-view-user-image admin-users-avatar-empty">
                  {viewUser.name?.[0] || 'U'}
                </div>
              )}

              <h3>{viewUser.name}</h3>
              <p>{viewUser.email}</p>
              <span className="admin-view-role">{viewUser.role}</span>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box admin-create-modal">
            <button
              type="button"
              className="admin-modal-close"
              onClick={closeEditModal}
            >
              <X size={18} />
            </button>

            <h3 className="admin-modal-title">Edit Admin / Employee</h3>

            <form className="admin-user-form" onSubmit={updateUser}>
              <div className="admin-user-form-field">
                <label>Name</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              <div className="admin-user-form-field">
                <label>Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>

              <div className="admin-user-form-field">
                <label>Role</label>
                <select
                  className="form-input"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>

              <div className="admin-user-form-field">
                <label>Profile Photo</label>
                <div className="admin-user-file-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        image: e.target.files?.[0] || null
                      })
                    }
                  />
                </div>
              </div>

              {editImagePreview && (
                <div className="admin-user-image-preview-wrap">
                  <img
                    src={editImagePreview}
                    alt="Edit preview"
                    className="admin-user-image-preview"
                  />
                </div>
              )}

              <button className="primary-btn admin-save-full-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box admin-delete-box">
            <h3 className="admin-modal-title">Delete User</h3>
            <p className="muted">Are you sure you want to delete this user?</p>

            <div className="admin-user-form-actions">
              <button
                type="button"
                className="admin-user-cancel-btn"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-delete-btn"
                onClick={() => remove(deleteId)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}