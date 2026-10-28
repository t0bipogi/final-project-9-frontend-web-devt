// Deterministic pastel colors: the same text always gives the same color.
export function pastel(seed = "") {
  let h = 0;
  for (const ch of String(seed).trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return { background: `hsl(${hue} 70% 91%)`, color: `hsl(${hue} 45% 28%)` };
}
