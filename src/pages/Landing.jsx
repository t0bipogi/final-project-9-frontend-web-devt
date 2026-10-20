import { Link } from "react-router-dom";

const SAMPLE = [
  { name: "Amara Okafor", sub: "+63 917 555 0142  ·  amara@example.com", tag: "Family", fav: true },
  { name: "Daniel Reyes", sub: "+63 918 555 0199  ·  daniel@example.com", tag: "Work", fav: true },
  { name: "Lena Fischer", sub: "+63 920 555 0173  ·  lena@example.com", tag: "Friends", fav: false },
  { name: "Marco Bianchi", sub: "+63 915 555 0128  ·  marco@example.com", tag: "Friends", fav: false },
];

const FEATURES = [
  {
    title: "Find anyone as you type",
    text: "Search by name, phone, or email and the list narrows instantly.",
  },
  {
    title: "Sort with categories",
    text: "Group contacts as Family, Friends, Work, or anything your admin sets up, then filter in one click.",
  },
  {
    title: "Keep favorites on top",
    text: "Star the people you reach most so they are always first in your list.",
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="land-bar">
        <div className="land-inner land-bar-inner">
          <span className="brand">Contacts</span>
          <nav className="land-actions">
            <Link to="/login" className="land-signin">Sign in</Link>
            <Link to="/register" className="btn">Create account</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="land-inner hero">
          <div className="hero-copy">
            <h1>Your address book, kept simple.</h1>
            <p className="hero-sub">
              Save contact details, sort people into categories, and search them instantly.
              One private list, always up to date, replacing scattered spreadsheets and paper notes.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-lg">Create account</Link>
              <Link to="/login" className="btn-ghost btn-lg">Sign in</Link>
            </div>
          </div>

          <div className="preview" aria-hidden="true">
            <div className="preview-search">Search name, phone, email</div>
            <ul className="list preview-list">
              {SAMPLE.map((c) => (
                <li key={c.name} className="row">
                  <div className="avatar">{c.name[0]}</div>
                  <div className="row-main">
                    <div className="row-name">{c.name}</div>
                    <div className="row-sub">{c.sub}</div>
                  </div>
                  <span className="tag">{c.tag}</span>
                  <span className={"preview-star" + (c.fav ? " fav-on" : "")}>{c.fav ? "★" : "☆"}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="land-inner features">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature">
              <h2>{f.title}</h2>
              <p className="muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="land-inner land-foot">
        <span className="muted">Contact Management System</span>
        <span className="muted">Group 9 · C3A</span>
      </footer>
    </div>
  );
}
