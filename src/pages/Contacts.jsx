import { useEffect, useMemo, useState } from "react";
import api, { errMsg, idOf } from "../api.js";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import { isEmail, isPhone } from "../validate.js";

const EMPTY = { name: "", phone: "", email: "", address: "", category: "", notes: "", isFavorite: false };

// The backend may return `category` as an id or as a populated object.
const catId = (c) => (c && typeof c === "object" ? idOf(c) : c) || "";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | contact
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    try {
      const [c, k] = await Promise.all([api.get("/contacts"), api.get("/categories")]);
      setContacts(c.data);
      setCategories(k.data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const catName = (c) => {
    if (c && typeof c === "object") return c.name;
    return categories.find((k) => idOf(k) === c)?.name || "";
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts
      .filter((c) => !onlyFav || c.isFavorite)
      .filter((c) => !filter || catId(c.category) === filter)
      .filter((c) =>
        !q ||
        [c.name, c.email, c.phone, catName(c.category)].some((v) => v?.toLowerCase().includes(q))
      )
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.localeCompare(b.name));
  }, [contacts, search, filter, onlyFav, categories]);

  const toggleFav = async (c) => {
    const next = !c.isFavorite;
    setContacts((list) => list.map((x) => (idOf(x) === idOf(c) ? { ...x, isFavorite: next } : x)));
    try {
      await api.put(`/contacts/${idOf(c)}`, { isFavorite: next });
    } catch (e) {
      setError(errMsg(e));
      load();
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/contacts/${idOf(removing)}`);
      setContacts((list) => list.filter((x) => idOf(x) !== idOf(removing)));
      setRemoving(null);
    } catch (e) {
      setError(errMsg(e));
      setRemoving(null);
    }
  };

  const onSaved = (saved, isNew) => {
    setContacts((list) =>
      isNew ? [saved, ...list] : list.map((x) => (idOf(x) === idOf(saved) ? saved : x))
    );
    setEditing(null);
  };

  return (
    <>
      <div className="page-head">
        <h1>My contacts</h1>
        <button className="btn" onClick={() => setEditing("new")}>New contact</button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, phone, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contacts"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((k) => (
            <option key={idOf(k)} value={idOf(k)}>{k.name}</option>
          ))}
        </select>
        <button
          className={"chip" + (onlyFav ? " chip-on" : "")}
          onClick={() => setOnlyFav(!onlyFav)}
          aria-pressed={onlyFav}
        >
          Favorites
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="empty">
          {contacts.length === 0 ? (
            <>
              <p>Your address book is empty.</p>
              <button className="btn" onClick={() => setEditing("new")}>Add your first contact</button>
            </>
          ) : (
            <p>No contacts match your search.</p>
          )}
        </div>
      ) : (
        <ul className="list">
          {visible.map((c) => (
            <li key={idOf(c)} className="row">
              <div className="avatar" aria-hidden="true">{c.name?.[0]?.toUpperCase()}</div>
              <div className="row-main">
                <div className="row-name">{c.name}</div>
                <div className="row-sub">{[c.phone, c.email].filter(Boolean).join("  ·  ")}</div>
              </div>
              {catName(c.category) && <span className="tag">{catName(c.category)}</span>}
              <button
                className={"icon-btn" + (c.isFavorite ? " fav-on" : "")}
                onClick={() => toggleFav(c)}
                aria-label={c.isFavorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={!!c.isFavorite}
              >
                {c.isFavorite ? "★" : "☆"}
              </button>
              <button className="btn-text" onClick={() => setEditing(c)}>Edit</button>
              <button className="btn-text danger" onClick={() => setRemoving(c)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ContactForm
          contact={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      {removing && (
        <Modal title="Delete contact" onClose={() => setRemoving(null)}>
          <p>Delete <strong>{removing.name}</strong> from your address book? This can't be undone.</p>
          <div className="actions">
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={remove}>Delete contact</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ContactForm({ contact, categories, onClose, onSaved }) {
  const isNew = !contact;
  const [form, setForm] = useState(
    isNew ? EMPTY : { ...EMPTY, ...contact, category: catId(contact.category) }
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter a name.";
    if (!form.phone.trim()) errs.phone = "Enter a phone number.";
    else if (!isPhone(form.phone.trim())) errs.phone = "Use digits, spaces, + ( ) or -.";
    if (form.email && !isEmail(form.email)) errs.email = "Enter a valid email address.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setServerError("");
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      isFavorite: !!form.isFavorite,
      category: form.category || null,
    };
    try {
      const { data } = isNew
        ? await api.post("/contacts", payload)
        : await api.put(`/contacts/${idOf(contact)}`, payload);
      onSaved(data, isNew);
    } catch (err) {
      setServerError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? "New contact" : "Edit contact"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {serverError && <div className="alert">{serverError}</div>}
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <div className="two-col">
          <Field label="Phone" error={errors.phone}>
            <input value={form.phone} onChange={set("phone")} inputMode="tel" />
          </Field>
          <Field label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={set("email")} />
          </Field>
        </div>
        <Field label="Category">
          <select value={form.category} onChange={set("category")}>
            <option value="">None</option>
            {categories.map((k) => (
              <option key={idOf(k)} value={idOf(k)}>{k.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Address">
          <input value={form.address} onChange={set("address")} />
        </Field>
        <Field label="Notes">
          <textarea rows="3" value={form.notes} onChange={set("notes")} />
        </Field>
        <label className="check">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
          />
          Mark as favorite
        </label>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save contact"}</button>
        </div>
      </form>
    </Modal>
  );
}
