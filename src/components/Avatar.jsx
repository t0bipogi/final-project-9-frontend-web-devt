import { pastel } from "../colors.js";

export default function Avatar({ name = "", photo, size = 36 }) {
  const box = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (photo) return <img className="avatar avatar-img" src={photo} alt="" style={box} />;
  return (
    <div className="avatar" style={{ ...box, ...pastel(name) }} aria-hidden="true">
      {name.trim()[0]?.toUpperCase() || "?"}
    </div>
  );
}
