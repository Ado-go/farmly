import {
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
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
import {
  User,
  ShoppingCart,
  Leaf,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useEffect, useState } from "react";

function RootLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { cart, totalPrice } = useCart();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [isCartMenuOpen, setIsCartMenuOpen] = useState(false);

  useEffect(() => {
    const hasCustomTitle = ["/products", "/events", "/offers", "/farms"].some(
      (path) => location.pathname.startsWith(path)
    );

    if (!hasCustomTitle) {
      document.title = t("farmly");
    }
  }, [location.pathname, t]);

  const handleGoToCart = () => {
    setIsCartMenuOpen(false);
    navigate({ to: "/cart" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between p-4 border-b bg-foreground">
        {/* LEFT LINKS */}
        <div id="mainMenu" className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg">
            {t("farmly")}
          </Link>
          <Link to="/products" className="font-semibold text-lg">
            {t("products")}
          </Link>
          <Link to="/events" className="font-semibold text-lg">
            {t("events")}
          </Link>
          <Link to="/offers" className="font-semibold text-lg">
            {t("offers")}
          </Link>
          <Link to="/farms" className="font-semibold text-lg">
            {t("farms")}
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={isCartMenuOpen} onOpenChange={setIsCartMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              {cart.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  {t("cart.empty")}
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {cart.map((item) => (
                      <div key={item.productId} className="p-2 text-sm">
                        <p className="font-medium truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}× {item.unitPrice} €
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t text-sm flex justify-between items-center">
                    <span className="font-medium">
                      {t("cart.total")}: {totalPrice.toFixed(2)} €
                    </span>
                    <Button size="sm" onClick={handleGoToCart}>
                      {t("cart.open")}
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
          <LanguageToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full p-0 h-10 w-10 overflow-hidden"
              >
                {user ? (
                  <ProfileAvatar
                    imageUrl={user.profileImageUrl}
                    name={user.name}
                    size={36}
                    className="border-0 bg-transparent"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
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
                  <DropdownMenuItem asChild>
                    <Link to="/offers/my">{t("my_offers")}</Link>
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

      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Leaf className="h-5 w-5 text-primary" />
            <span>{t("farmly")}</span>
          </div>
          <p className="text-muted-foreground">{t("footer.tagline")}</p>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4" />
            {t("footer.contact")}
          </h3>
          <div className="space-y-2 text-muted-foreground">
            <p>{t("footer.address")}</p>
            <a
              href="tel:+421800123456"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Phone className="h-4 w-4" />
              <span>{t("footer.phone")}</span>
            </a>
            <a
              href="mailto:podpora@farmly.sk"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              <span>{t("footer.email")}</span>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">{t("footer.links")}</h3>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <Link to="/products" className="hover:text-foreground">
              {t("products")}
            </Link>
            <Link to="/events" className="hover:text-foreground">
              {t("events")}
            </Link>
            <Link to="/offers" className="hover:text-foreground">
              {t("offers")}
            </Link>
            <Link to="/farms" className="hover:text-foreground">
              {t("farms")}
            </Link>
            <Link to="/cart" className="hover:text-foreground">
              {t("cart.open")}
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4" />
            {t("footer.supportTitle")}
          </h3>
          <p className="text-muted-foreground">{t("footer.hours")}</p>
          <p className="text-muted-foreground">{t("footer.responseTime")}</p>
        </div>
      </div>

      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        {t("footer.copyright", { year: currentYear })}
      </div>
    </footer>
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
