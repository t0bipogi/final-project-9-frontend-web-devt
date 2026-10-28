import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const timer = useRef();

  const show = useCallback((text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {msg && <div className="toast">{msg}</div>}
      </div>
    </ToastCtx.Provider>
  );
}
