import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Contacts from "./pages/Contacts.jsx";
import Profile from "./pages/Profile.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminCategories from "./pages/AdminCategories.jsx";

function Protected({ children, admin }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/contacts" replace />;
  return children;
}

// Public pages (landing, login, register). Signed-in users go straight to their contacts.
function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/contacts" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="contacts" element={<Contacts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin/users" element={<Protected admin><AdminUsers /></Protected>} />
        <Route path="admin/categories" element={<Protected admin><AdminCategories /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
