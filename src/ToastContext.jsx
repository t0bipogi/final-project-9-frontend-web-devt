import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const ToastCtx = createContext(() => {});

// toast("Saved")  or  toast({ title, text, type: "success" | "error", duration })
export const useToast = () => useContext(ToastCtx);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((input) => {
    const t = typeof input === "string" ? { title: input, duration: 2200 } : input;
    const id = nextId++;
    setToasts((list) => [...list.slice(-3), { id, type: "success", ...t }]);
    timers.current[id] = setTimeout(() => dismiss(id), t.duration ?? 4500);
  }, [dismiss]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"toast toast-" + t.type}>
            <span className="toast-icon">
              {t.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.text && <div className="toast-text">{t.text}</div>}
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
