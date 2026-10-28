import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Copy, Download, Search, Star, Users, X } from "lucide-react";
import api, { errMsg, idOf } from "../api.js";
import Modal from "../components/Modal.jsx";
import Confirm from "../components/Confirm.jsx";
import Field from "../components/Field.jsx";
import Avatar from "../components/Avatar.jsx";
import Tag from "../components/Tag.jsx";
import { useToast } from "../ToastContext.jsx";
import { useDebounce } from "../hooks.js";
import { fileToAvatar } from "../image.js";
import { downloadContactsCsv } from "../csv.js";
import { isEmail, isPhone } from "../validate.js";

const EMPTY = { name: "", phone: "", email: "", address: "", category: "", notes: "", isFavorite: false, photo: "" };

// The backend may return `category` as an id or as a populated object.
const catId = (c) => (c && typeof c === "object" ? idOf(c) : c) || "";

const SORTERS = {
  az: (a, b) => a.name.localeCompare(b.name),
  za: (a, b) => b.name.localeCompare(a.name),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
};

function CopyButton({ text, label }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    toast("Copied to clipboard!");
  };
  return (
    <button className="copy-btn" onClick={copy} aria-label={`Copy ${label}`} title="Copy">
      <Copy size={14} />
    </button>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounce(query, 300);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("az");
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
        !q || [c.name, c.email, c.phone, catName(c.category)].some((v) => v?.toLowerCase().includes(q))
      )
      .sort(SORTERS[sort]);
  }, [contacts, search, filter, sort, onlyFav, categories]);

  const hasFilters = !!(query || filter || onlyFav);
  const clearFilters = () => { setQuery(""); setFilter(""); setOnlyFav(false); };

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
    } catch (e) {
      setError(errMsg(e));
    }
    setRemoving(null);
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
        <div className="search">
          <input
            type="text"
            placeholder="Search name, phone, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search contacts"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <select className="select-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((k) => (
            <option key={idOf(k)} value={idOf(k)}>{k.name}</option>
          ))}
        </select>
        <select className="select-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort contacts">
          <option value="az">Name A–Z</option>
          <option value="za">Name Z–A</option>
          <option value="newest">Recently added</option>
        </select>
        <button
          className={"chip" + (onlyFav ? " chip-on" : "")}
          onClick={() => setOnlyFav(!onlyFav)}
          aria-pressed={onlyFav}
        >
          <Star size={14} fill={onlyFav ? "currentColor" : "none"} /> Favorites
        </button>
        <button
          className="btn-ghost btn-sm export"
          onClick={() => downloadContactsCsv(visible, (c) => catName(c))}
          disabled={visible.length === 0}
          title="Download the contacts shown below as a CSV file"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">{contacts.length === 0 ? <Users size={26} /> : <Search size={26} />}</div>
          {contacts.length === 0 ? (
            <>
              <p className="empty-title">Your address book is empty</p>
              <p className="muted">Add your first contact to get started.</p>
              <button className="btn" onClick={() => setEditing("new")}>Add your first contact</button>
            </>
          ) : (
            <>
              <p className="empty-title">No contacts match</p>
              <p className="muted">Try a different search or remove a filter.</p>
              {hasFilters && <button className="btn-ghost" onClick={clearFilters}>Clear filters</button>}
            </>
          )}
        </div>
      ) : (
        <ul className="list">
          {visible.map((c) => (
            <li key={idOf(c)} className="row">
              <Avatar name={c.name} photo={c.photo} />
              <div className="row-main">
                <div className="row-name">{c.name}</div>
                <div className="row-sub">
                  {c.phone && (
                    <span className="contact-item">
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>{c.phone}</a>
                      <CopyButton text={c.phone} label="phone number" />
                    </span>
                  )}
                  {c.email && (
                    <span className="contact-item">
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                      <CopyButton text={c.email} label="email address" />
                    </span>
                  )}
                </div>
              </div>
              {catName(c.category) && <Tag name={catName(c.category)} />}
              <button
                className={"icon-btn" + (c.isFavorite ? " fav-on" : "")}
                onClick={() => toggleFav(c)}
                aria-label={c.isFavorite ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={!!c.isFavorite}
              >
                {c.isFavorite ? "★" : "☆"}
              </button>
              <button className="btn-text" onClick={() => setEditing(c)}>Edit</button>
              <button className="btn-text" onClick={() => setRemoving(c)}>Delete</button>
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
        <Confirm
          title="Delete contact"
          confirmLabel="Delete contact"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        >
          Delete <strong>{removing.name}</strong> from your address book? This can't be undone.
        </Confirm>
      )}
    </>
  );
}

function ContactForm({ contact, categories, onClose, onSaved }) {
  const isNew = !contact;
  const [form, setForm] = useState(
    isNew ? EMPTY : { ...EMPTY, ...contact, category: catId(contact.category), photo: contact.photo || "" }
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await fileToAvatar(file);
      setForm((f) => ({ ...f, photo: data }));
      setPhotoError("");
    } catch (err) {
      setPhotoError(err.message);
    }
  };

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
      photo: form.photo || "",
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

        <div className="photo-pick">
          <Avatar name={form.name} photo={form.photo} size={64} />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={pickPhoto}
            />
            <div className="photo-actions">
              <button type="button" className="btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
                <Camera size={14} /> {form.photo ? "Change photo" : "Add photo"}
              </button>
              {form.photo && (
                <button type="button" className="btn-text" onClick={() => setForm({ ...form, photo: "" })}>
                  Remove
                </button>
              )}
            </div>
            {photoError && <span className="field-error">{photoError}</span>}
          </div>
        </div>

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
