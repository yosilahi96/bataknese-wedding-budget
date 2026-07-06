import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  isAdmin: false,
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/");
      return;
    }
    loadUsers();
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.adminListUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  function openAdd() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      isAdmin: u.isAdmin,
    });
    setError("");
    setShowModal(true);
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingUser) {
        await api.adminUpdateUser(editingUser.id, {
          name: form.name,
          email: form.email,
          isAdmin: form.isAdmin,
        });
      } else {
        await api.adminCreateUser({
          name: form.name,
          email: form.email,
          password: form.password,
          isAdmin: form.isAdmin,
        });
      }
      setShowModal(false);
      loadUsers();
      setAlertModal({
        title: editingUser ? "User Updated" : "User Created",
        message: `"${form.name}" has been ${editingUser ? "updated" : "created"} successfully.`,
        type: "success",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openResetPassword(u) {
    setResetUser(u);
    setResetPassword("");
    setResetError("");
    setShowResetModal(true);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetting(true);
    setResetError("");
    try {
      await api.adminResetPassword(resetUser.id, { password: resetPassword });
      setShowResetModal(false);
      setAlertModal({
        title: "Password Reset",
        message: `Password for "${resetUser.name}" has been reset successfully.`,
        type: "success",
      });
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.adminDeleteUser(id);
      setConfirmAction(null);
      loadUsers();
      setAlertModal({
        title: "User Deleted",
        message: "User and all their wedding projects have been deleted.",
        type: "success",
      });
    } catch (err) {
      setConfirmAction(null);
      setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
    }
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Create, edit, and manage user accounts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ gap: "var(--sp-1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add User
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          {filteredUsers.length > PAGE_SIZE
            ? `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of ${filteredUsers.length} users`
            : `${filteredUsers.length} users`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="card empty-state">
          <p>{searchQuery ? "No users match your search." : "No users found."}</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ textAlign: "center" }}>Projects</th>
                  <th>Joined</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                      {u.name}
                      {u.id === user.id && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginLeft: "var(--sp-2)" }}>(you)</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{u.email}</td>
                    <td>
                      {u.isAdmin ? (
                        <span className="badge badge-warning">Admin</span>
                      ) : (
                        <span className="badge badge-neutral">User</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.8125rem" }}>{u._count.projects}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Edit" style={{ padding: "4px 6px", height: "auto" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openResetPassword(u)} title="Reset Password" style={{ padding: "4px 6px", height: "auto" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmAction({ id: u.id, name: u.name, projectCount: u._count.projects })}
                          title={u.id === user.id ? "Cannot delete yourself" : "Delete"}
                          disabled={u.id === user.id}
                          style={{ padding: "4px 6px", height: "auto", color: "var(--text-tertiary)" }}
                          onMouseEnter={(e) => { if (u.id !== user.id) e.currentTarget.style.color = "var(--danger)"; }}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="pagination-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCurrentPage(page)}
              style={{ minWidth: 36 }}
            >
              {page}
            </button>
          ))}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <h3>{editingUser ? "Edit User" : "Add User"}</h3>
            {error && <div className="inline-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="user@example.com" />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
                </div>
              )}
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isAdmin}
                    onChange={(e) => update("isAdmin", e.target.checked)}
                    disabled={editingUser && editingUser.id === user.id}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  Admin privileges
                  {editingUser && editingUser.id === user.id && (
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>(cannot change own)</span>
                  )}
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Reset Password</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--sp-5)" }}>
              Set a new password for <strong>{resetUser?.name}</strong> ({resetUser?.email})
            </p>
            {resetError && <div className="inline-error">{resetError}</div>}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resetting}>
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmAction && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${confirmAction.name}"?${confirmAction.projectCount > 0 ? ` This will also permanently delete their ${confirmAction.projectCount} wedding project${confirmAction.projectCount > 1 ? "s" : ""}.` : ""} This cannot be undone.`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={() => handleDelete(confirmAction.id)}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  );
}
