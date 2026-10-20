import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/contacts" className="brand">Contacts</Link>
          <nav className="nav">
            <NavLink to="/contacts">My contacts</NavLink>
            {user.role === "admin" && (
              <>
                <NavLink to="/admin/users">Users</NavLink>
                <NavLink to="/admin/categories">Categories</NavLink>
              </>
            )}
            <NavLink to="/profile">Profile</NavLink>
          </nav>
          <button className="btn-text" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
