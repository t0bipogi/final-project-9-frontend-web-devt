import { useEffect, useState } from "react";
import api, { errMsg, idOf } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import Confirm from "../components/Confirm.jsx";
import Field from "../components/Field.jsx";
import { isEmail } from "../validate.js";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: "deactivate" | "delete", user }

  useEffect(() => {
    api.get("/users")
      .then((r) => setUsers(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const replace = (u) => setUsers((list) => list.map((x) => (idOf(x) === idOf(u) ? { ...x, ...u } : x)));

  // Assumes the User model carries an `isActive` flag (default true).
  const setActive = async (u, active) => {
    setError("");
    try {
      const { data } = await api.put(`/users/${idOf(u)}`, { isActive: active });
      replace({ ...u, ...data, isActive: active });
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const remove = async (u) => {
    setError("");
    try {
      await api.delete(`/users/${idOf(u)}`);
      setUsers((list) => list.filter((x) => idOf(x) !== idOf(u)));
    } catch (e) {
      setError(errMsg(e));
    }
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
                    <td><span className={"pill pill-" + u.role}>{u.role}</span></td>
                    <td>
                      <span className={"pill " + (inactive ? "pill-off" : "pill-active")}>
                        {inactive ? "Deactivated" : "Active"}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="cell-actions-inner">
                        <button className="btn-text" onClick={() => setEditing(u)}>Edit</button>
                        {!self && (
                          <>
                            {inactive ? (
                              <button className="btn-text act-green" onClick={() => setActive(u, true)}>Activate</button>
                            ) : (
                              <button className="btn-text act-amber" onClick={() => setConfirm({ type: "deactivate", user: u })}>
                                Deactivate
                              </button>
                            )}
                            <button className="btn-text act-red" onClick={() => setConfirm({ type: "delete", user: u })}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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

      {confirm?.type === "deactivate" && (
        <Confirm
          title="Deactivate user"
          tone="warn"
          confirmLabel="Deactivate user"
          onConfirm={async () => { await setActive(confirm.user, false); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        >
          Deactivate <strong>{confirm.user.name}</strong>? They won't be able to sign in until you activate them again.
        </Confirm>
      )}

      {confirm?.type === "delete" && (
        <Confirm
          title="Delete user"
          confirmLabel="Delete user"
          onConfirm={async () => { await remove(confirm.user); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        >
          Delete <strong>{confirm.user.name}</strong> and all of their contacts? This can't be undone.
        </Confirm>
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
