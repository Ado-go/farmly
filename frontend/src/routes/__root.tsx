import { Outlet, Link } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "react-i18next";
import "../css/root.css";

function RootLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <nav>
        <Link to="/">{t("farmly")} 🌱</Link>
        {user && <Link to="/profile">{t("profile")}</Link>}
        {user && user.role === "FARMER" && <Link to="/farm">{t("farm")}</Link>}
        {!user && <Link to="/login">{t("login")}</Link>}
        {!user && <Link to="/register">{t("register")}</Link>}
        {user && (
          <span>
            {t("signedIn")} {user.name} ({user.role})
          </span>
        )}
        {user && <LogoutButton />}
        <ModeToggle />
        <LanguageToggle />
      </nav>
      <Outlet />
    </div>
  );
}

export const Route = createRootRoute({ component: RootLayout });
