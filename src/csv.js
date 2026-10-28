// Quotes a cell. Text that starts with = + - @ is prefixed so spreadsheets don't run it as a formula.
const cell = (value, isPhone = false) => {
  let s = String(value ?? "");
  if (!isPhone && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadContactsCsv(contacts, catName) {
  const head = ["Name", "Phone", "Email", "Address", "Category", "Favorite", "Notes"];
  const rows = contacts.map((c) => [
    c.name, c.phone, c.email, c.address, catName(c.category), c.isFavorite ? "Yes" : "No", c.notes,
  ]);
  const csv = [head, ...rows].map((r) => r.map((v, i) => cell(v, i === 1)).join(",")).join("\r\n");

  // The BOM makes Excel read accented characters correctly.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
