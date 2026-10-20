import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import api, { errMsg, idOf } from "../api.js";
import Field from "../components/Field.jsx";
import { isEmail } from "../validate.js";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name || "", email: user.email || "", password: "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Enter your name.";
    if (!isEmail(form.email)) errs.email = "Enter a valid email address.";
    if (form.password && form.password.length < 6) errs.password = "Use at least 6 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setMsg({ type: "", text: "" });
    const payload = { name: form.name.trim(), email: form.email };
    if (form.password) payload.password = form.password;
    try {
      const { data } = await api.put(`/users/${idOf(user)}`, payload);
      updateUser({ ...user, ...data, password: undefined });
      setForm({ ...form, password: "" });
      setMsg({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head"><h1>Profile</h1></div>
      <form className="narrow" onSubmit={submit} noValidate>
        {msg.text && <div className={msg.type === "ok" ? "notice" : "alert"}>{msg.text}</div>}
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="New password" error={errors.password}>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="Leave blank to keep your current password"
            autoComplete="new-password"
          />
        </Field>
        <div className="actions left">
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </>
  );
}
