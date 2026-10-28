import { useEffect, useState } from "react";
import api, { errMsg, idOf } from "../api.js";
import Confirm from "../components/Confirm.jsx";

const countLabel = (n) => `${n} contact${n === 1 ? "" : "s"}`;

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    api.get("/categories")
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setError("Enter a category name.");
    if (items.some((i) => i.name.toLowerCase() === value.toLowerCase()))
      return setError("That category already exists.");
    setError("");
    try {
      const { data } = await api.post("/categories", { name: value });
      setItems([...items, { ...data, contactCount: 0 }]);
      setName("");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const saveEdit = async (c) => {
    const value = editName.trim();
    if (!value) return setError("Enter a category name.");
    if (items.some((i) => idOf(i) !== idOf(c) && i.name.toLowerCase() === value.toLowerCase()))
      return setError("That category already exists.");
    setError("");
    try {
      const { data } = await api.put(`/categories/${idOf(c)}`, { name: value });
      setItems(items.map((i) => (idOf(i) === idOf(c) ? { ...i, ...data } : i)));
      setEditId(null);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const askDelete = (c) => {
    if (c.contactCount > 0) {
      setError(`"${c.name}" is used by ${countLabel(c.contactCount)}. Move or delete those contacts before deleting the category.`);
      return;
    }
    setError("");
    setRemoving(c);
  };

  const remove = async () => {
    try {
      await api.delete(`/categories/${idOf(removing)}`);
      setItems(items.filter((i) => idOf(i) !== idOf(removing)));
      setError("");
    } catch (err) {
      setError(errMsg(err));
    }
    setRemoving(null);
  };

  return (
    <>
      <div className="page-head"><h1>Categories</h1></div>

      <form className="inline-form" onSubmit={add}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
        />
        <button className="btn">Add category</button>
      </form>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty-box"><p className="empty-title">No categories yet</p><p className="muted">Add one above so users can organize contacts.</p></div>
      ) : (
        <ul className="list">
          {items.map((c) => (
            <li key={idOf(c)} className="row">
              {editId === idOf(c) ? (
                <>
                  <input
                    className="grow"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(c);
                      if (e.key === "Escape") setEditId(null);
                    }}
                    autoFocus
                    aria-label="Category name"
                  />
                  <button className="btn btn-sm" onClick={() => saveEdit(c)}>Save</button>
                  <button className="btn-ghost btn-sm" onClick={() => { setEditId(null); setError(""); }}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="row-main">
                    <span className="row-name">{c.name}</span>
                    <span className="count">{countLabel(c.contactCount ?? 0)}</span>
                  </div>
                  <button className="btn-text" onClick={() => { setEditId(idOf(c)); setEditName(c.name); setError(""); }}>Rename</button>
                  <button className="btn-text act-red" onClick={() => askDelete(c)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {removing && (
        <Confirm
          title="Delete category"
          confirmLabel="Delete category"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        >
          Delete <strong>{removing.name}</strong>? Contacts can no longer be assigned to it.
        </Confirm>
      )}
    </>
  );
}
