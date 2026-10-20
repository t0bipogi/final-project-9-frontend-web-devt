import { useEffect, useState } from "react";
import api, { errMsg, idOf } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { isEmail } from "../validate.js";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    api.get("/users")
      .then((r) => setUsers(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const replace = (u) => setUsers((list) => list.map((x) => (idOf(x) === idOf(u) ? { ...x, ...u } : x)));

  // Assumes the User model also carries an `isActive` flag (default true).
  const toggleActive = async (u) => {
    const next = u.isActive === false;
    try {
      const { data } = await api.put(`/users/${idOf(u)}`, { isActive: next });
      replace({ ...u, ...data, isActive: next });
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/users/${idOf(removing)}`);
      setUsers((list) => list.filter((x) => idOf(x) !== idOf(removing)));
    } catch (e) {
      setError(errMsg(e));
    }
    setRemoving(null);
  };

  return (
    <>
      <div className="page-head"><h1>Users</h1></div>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = idOf(u) === idOf(me);
                const inactive = u.isActive === false;
                return (
                  <tr key={idOf(u)} className={inactive ? "dim" : ""}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{inactive ? "Deactivated" : "Active"}</td>
                    <td className="cell-actions">
                      <button className="btn-text" onClick={() => setEditing(u)}>Edit</button>
                      {!self && (
                        <>
                          <button className="btn-text" onClick={() => toggleActive(u)}>
                            {inactive ? "Activate" : "Deactivate"}
                          </button>
                          <button className="btn-text danger" onClick={() => setRemoving(u)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUser
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(u) => { replace(u); setEditing(null); }}
        />
      )}

      {removing && (
        <Modal title="Delete user" onClose={() => setRemoving(null)}>
          <p>Delete <strong>{removing.name}</strong> and their account? This can't be undone.</p>
          <div className="actions">
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={remove}>Delete user</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function EditUser({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Enter a name.";
    if (!isEmail(form.email)) errs.email = "Enter a valid email address.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const { data } = await api.put(`/users/${idOf(user)}`, { ...form, name: form.name.trim() });
      onSaved({ ...user, ...form, ...data });
    } catch (err) {
      setServerError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit user" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {serverError && <div className="alert">{serverError}</div>}
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={set("role")}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save user"}</button>
        </div>
      </form>
    </Modal>
  );
}
