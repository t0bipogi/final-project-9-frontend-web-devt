import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { errMsg } from "../api.js";
import Field from "../components/Field.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { isEmail } from "../validate.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setServerError("");
    try {
      await login(form.email, form.password);
      navigate("/contacts");
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Link to="/" className="back-link"><ArrowLeft size={14} /> Back to home</Link>
        <h1>Sign in</h1>
        <p className="muted">Open your address book.</p>
        {serverError && <div className="alert">{serverError}</div>}
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set("email")} autoComplete="email" autoFocus />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput value={form.password} onChange={set("password")} autoComplete="current-password" />
        </Field>
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted center">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
