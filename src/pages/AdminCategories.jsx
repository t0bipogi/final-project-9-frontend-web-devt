import { useEffect, useState } from "react";
import api, { errMsg, idOf } from "../api.js";
import Modal from "../components/Modal.jsx";

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
      setItems([...items, data]);
      setName("");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const saveEdit = async (c) => {
    const value = editName.trim();
    if (!value) return setError("Enter a category name.");
    setError("");
    try {
      const { data } = await api.put(`/categories/${idOf(c)}`, { name: value });
      setItems(items.map((i) => (idOf(i) === idOf(c) ? { ...i, ...data } : i)));
      setEditId(null);
    } catch (err) {
      setError(errMsg(err));
    }
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
        <div className="empty"><p>No categories yet. Add one above so users can organize contacts.</p></div>
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
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(c)}
                    autoFocus
                    aria-label="Category name"
                  />
                  <button className="btn-text" onClick={() => saveEdit(c)}>Save</button>
                  <button className="btn-text" onClick={() => setEditId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="row-main"><div className="row-name">{c.name}</div></div>
                  <button className="btn-text" onClick={() => { setEditId(idOf(c)); setEditName(c.name); }}>Rename</button>
                  <button className="btn-text danger" onClick={() => setRemoving(c)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {removing && (
        <Modal title="Delete category" onClose={() => setRemoving(null)}>
          <p>Delete <strong>{removing.name}</strong>? Categories that still have contacts can't be deleted.</p>
          <div className="actions">
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={remove}>Delete category</button>
          </div>
        </Modal>
      )}
    </>
  );
}
