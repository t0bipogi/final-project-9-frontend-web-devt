import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import api, { errMsg, idOf } from "../api.js";
import Field from "../components/Field.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Avatar from "../components/Avatar.jsx";
import { isEmail } from "../validate.js";

const Msg = ({ msg }) =>
  msg.text ? <div className={msg.type === "ok" ? "notice" : "alert"}>{msg.text}</div> : null;

export default function Profile() {
  const { user, updateUser } = useAuth();

  // ----- account details -----
  const [info, setInfo] = useState({ name: user.name || "", email: user.email || "" });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoMsg, setInfoMsg] = useState({ type: "", text: "" });
  const [infoBusy, setInfoBusy] = useState(false);

  const saveInfo = async (e) => {
    e.preventDefault();
    const errs = {};
    if (info.name.trim().length < 2) errs.name = "Enter your name.";
    if (!isEmail(info.email)) errs.email = "Enter a valid email address.";
    setInfoErrors(errs);
    if (Object.keys(errs).length) return;

    setInfoBusy(true);
    setInfoMsg({ type: "", text: "" });
    try {
      const { data } = await api.put(`/users/${idOf(user)}`, { name: info.name.trim(), email: info.email });
      updateUser({ ...user, ...data });
      setInfoMsg({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setInfoMsg({ type: "error", text: errMsg(err) });
    } finally {
      setInfoBusy(false);
    }
  };

  // ----- password -----
  const EMPTY_PW = { current: "", next: "", confirm: "" };
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [pwBusy, setPwBusy] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.current) errs.current = "Enter your current password.";
    if (pw.next.length < 6) errs.next = "Use at least 6 characters.";
    else if (pw.next === pw.current) errs.next = "Choose a password different from your current one.";
    if (pw.confirm !== pw.next) errs.confirm = "Passwords don't match.";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwBusy(true);
    setPwMsg({ type: "", text: "" });
    try {
      await api.put(`/users/${idOf(user)}`, { currentPassword: pw.current, password: pw.next });
      setPw(EMPTY_PW);
      setPwMsg({ type: "ok", text: "Password updated." });
    } catch (err) {
      setPwMsg({ type: "error", text: errMsg(err) });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <div className="page-head"><h1>Profile</h1></div>

      <section className="card">
        <div className="card-head">
          <Avatar name={user.name} size={44} />
          <div>
            <h2>Account details</h2>
            <p className="muted card-sub">Your name and email, as shown on your account.</p>
          </div>
        </div>
        <form onSubmit={saveInfo} noValidate>
          <Msg msg={infoMsg} />
          <Field label="Name" error={infoErrors.name}>
            <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
          </Field>
          <Field label="Email" error={infoErrors.email}>
            <input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
          </Field>
          <div className="actions left">
            <button className="btn" disabled={infoBusy}>{infoBusy ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Password</h2>
            <p className="muted card-sub">Enter your current password to set a new one.</p>
          </div>
        </div>
        <form onSubmit={savePassword} noValidate>
          <Msg msg={pwMsg} />
          <Field label="Current password" error={pwErrors.current}>
            <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </Field>
          <Field label="New password" error={pwErrors.next}>
            <PasswordInput value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" error={pwErrors.confirm}>
            <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
          <div className="actions left">
            <button className="btn" disabled={pwBusy}>{pwBusy ? "Updating…" : "Update password"}</button>
          </div>
        </form>
      </section>
    </>
  );
}
