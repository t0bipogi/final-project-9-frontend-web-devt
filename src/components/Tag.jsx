import { pastel } from "../colors.js";

export default function Tag({ name }) {
  return <span className="tag" style={pastel(name)}>{name}</span>;
}
