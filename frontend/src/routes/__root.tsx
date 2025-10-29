import { Outlet, Link } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

function RootLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between p-4 border-b bg-foreground">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg">
            {t("farmly")}
          </Link>
          <Link to="/products" className="font-semibold text-lg">
            {t("products")}
          </Link>
          <Link to="/farms" className="font-semibold text-lg">
            {t("farms")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <LanguageToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.name}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">{t("profile")}</Link>
                  </DropdownMenuItem>
                  {user.role === "FARMER" && (
                    <DropdownMenuItem asChild>
                      <Link to="/farm">{t("my_farms")}</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "FARMER" && (
                    <DropdownMenuItem asChild>
                      <Link to="/event">{t("my_events")}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login">{t("login")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/register">{t("register")}</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-6xl font-bold">🌾404</h1>
      <p className="mt-4 text-xl">{t("page_not_found")}</p>
      <Link to="/" className="mt-6 text-blue-500 underline">
        {t("go_home")}
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
