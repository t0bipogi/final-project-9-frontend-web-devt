import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const V = 280;   // size of the crop area on screen (px)
const OUT = 320; // size of the saved photo (px)

// How big the image is drawn and how far it may be dragged while still covering the crop area.
function geometry(img, rot, zoom) {
  const swap = rot % 180 !== 0;
  const w = swap ? img.height : img.width;
  const h = swap ? img.width : img.height;
  const s = (V / Math.min(w, h)) * zoom;
  return { s, maxX: Math.max(0, (w * s - V) / 2), maxY: Math.max(0, (h * s - V) / 2) };
}

const clampOff = (off, g) => ({
  x: Math.min(g.maxX, Math.max(-g.maxX, off.x)),
  y: Math.min(g.maxY, Math.max(-g.maxY, off.y)),
});

function paint(ctx, size, img, rot, zoom, off) {
  const k = size / V;
  const { s } = geometry(img, rot, zoom);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2 + off.x * k, size / 2 + off.y * k);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(s * k, s * k);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

export default function PhotoCropper({ src, onCancel, onDone }) {
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const [img, setImg] = useState(null);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setError("Couldn't read that image.");
    i.src = src;
  }, [src]);

  const g = img ? geometry(img, rot, zoom) : null;
  const eff = g ? clampOff(off, g) : off;

  // Redraw the preview whenever anything changes.
  useEffect(() => {
    if (!img) return;
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = V * dpr;
    c.height = V * dpr;
    paint(c.getContext("2d"), V * dpr, img, rot, zoom, eff);
  });

  const down = (e) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, off: eff };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    setOff(clampOff({ x: d.off.x + e.clientX - d.x, y: d.off.y + e.clientY - d.y }, g));
  };
  const up = () => { drag.current = null; };

  const nudge = (e) => {
    const step = 12;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = map[e.key];
    if (!d || !g) return;
    e.preventDefault();
    setOff(clampOff({ x: eff.x + d[0], y: eff.y + d[1] }, g));
  };

  const changeZoom = (z) => setZoom(Math.min(3, Math.max(1, Number(z.toFixed(2)))));

  const done = () => {
    const c = document.createElement("canvas");
    c.width = c.height = OUT;
    paint(c.getContext("2d"), OUT, img, rot, zoom, eff);
    onDone(c.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div className="cropper">
      {error ? (
        <div className="alert">{error}</div>
      ) : (
        <div
          className="crop-view"
          style={{ width: V, height: V }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={nudge}
          tabIndex={0}
          role="application"
          aria-label="Photo crop area. Drag, or use the arrow keys, to reposition."
        >
          <canvas ref={canvasRef} style={{ width: V, height: V }} />
          <div className="crop-mask" />
        </div>
      )}
      <p className="muted crop-hint">Drag to reposition. The circle shows what will be visible.</p>

      <div className="crop-controls">
        <button type="button" className="icon-ctl" onClick={() => changeZoom(zoom - 0.25)} aria-label="Zoom out">
          <ZoomOut size={18} />
        </button>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom"
        />
        <button type="button" className="icon-ctl" onClick={() => changeZoom(zoom + 0.25)} aria-label="Zoom in">
          <ZoomIn size={18} />
        </button>
        <span className="crop-sep" />
        <button type="button" className="icon-ctl" onClick={() => setRot((rot + 270) % 360)} aria-label="Rotate left">
          <RotateCcw size={18} />
        </button>
        <button type="button" className="icon-ctl" onClick={() => setRot((rot + 90) % 360)} aria-label="Rotate right">
          <RotateCw size={18} />
        </button>
      </div>

      <div className="actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn" onClick={done} disabled={!img}>Use photo</button>
      </div>
    </div>
  );
}
