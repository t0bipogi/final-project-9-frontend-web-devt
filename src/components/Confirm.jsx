import { useState } from "react";
import Modal from "./Modal.jsx";

// Confirmation prompt for destructive actions. onConfirm may be async.
export default function Confirm({ title, confirmLabel, tone = "danger", onConfirm, onClose, children }) {
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <p>{children}</p>
      <div className="actions">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className={"btn " + (tone === "warn" ? "btn-warn" : "btn-danger")} onClick={go} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
