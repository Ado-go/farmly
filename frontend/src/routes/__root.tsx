import { Outlet, Link } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";

function RootLayout() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/">Home</Link>
        {user && <Link to="/profile">Profile</Link>}
        {user && user.role === "FARMER" && <Link to="/farm">Farm</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <span>
            Signed in as {user.email} ({user.role})
          </span>
        )}
        {user && <LogoutButton />}
      </nav>
      <Outlet />
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout });
