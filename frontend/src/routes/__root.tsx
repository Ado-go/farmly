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
  Menu,
  Leaf,
  MapPin,
  Phone,
  Mail,
  Clock,
  Package,
  Tag,
  CalendarRange,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useEffect } from "react";
import { NotFound } from "@/components/notFound";

function RootLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    const hasCustomTitle = ["/products", "/events", "/offers", "/farms"].some(
      (path) => location.pathname.startsWith(path)
    );

    if (!hasCustomTitle) {
      document.title = t("farmly");
    }
  }, [location.pathname, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const handleGoToCart = () => navigate({ to: "/cart" });
  type NavSearch = {
    page?: number;
    sort?: "newest" | "price" | "rating" | "popular";
    category?: string;
    order?: "asc" | "desc";
    search?: string;
    region?: string;
  };
  type NavLink = {
    to: string;
    label: string;
    search?: NavSearch;
    icon?: LucideIcon;
  };
  const homeLink: NavLink = { to: "/", label: t("farmly"), icon: Leaf };
  const navLinks: NavLink[] = [
    {
      to: "/products",
      label: t("products"),
      search: { page: 1 },
      icon: Package,
    },
    {
      to: "/events",
      label: t("events"),
      search: { page: 1, search: undefined, region: undefined },
      icon: CalendarRange,
    },
    {
      to: "/offers",
      label: t("offers"),
      search: { page: 1, search: undefined, category: undefined },
      icon: Tag,
    },
    { to: "/farms", label: t("farms"), search: { page: 1 }, icon: Sprout },
  ];
  const navItems: NavLink[] = [homeLink, ...navLinks];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-muted/60 bg-card/80 px-2 py-1 shadow-sm md:flex">
              {navItems.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    search={link.search}
                    className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary/30 bg-primary/15 text-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    }`}
                  >
                    {link.icon && (
                      <link.icon
                        className={`h-4 w-4 transition-transform duration-300 ${
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary group-hover:rotate-3"
                        }`}
                      />
                    )}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56 p-1">
                {navItems.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <DropdownMenuItem key={link.to} asChild>
                      <Link
                        to={link.to}
                        search={link.search}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-2 ${
                          active
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {link.icon && (
                            <link.icon
                              className={`h-4 w-4 ${
                                active
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          )}
                          <span>{link.label}</span>
                        </div>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-card/70 px-2 py-2">
                  <ModeToggle />
                  <LanguageToggle />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full border bg-card/80 shadow-sm hover:bg-primary/10"
              onClick={handleGoToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white shadow-sm">
                  {cart.length}
                </span>
              )}
            </Button>

            <div className="hidden items-center gap-2 rounded-full border border-muted/60 bg-card/80 px-2 py-1 shadow-sm md:flex">
              <ModeToggle />
              <LanguageToggle />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 overflow-hidden rounded-full border border-muted/70 bg-card/80 p-0 shadow-sm hover:bg-primary/10"
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
                    {user.role === "FARMER" && (
                      <DropdownMenuItem asChild>
                        <Link to="/farmer-stats">{t("farmer_stats")}</Link>
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
            <Link
              to="/products"
              search={{
                page: 1,
                sort: "newest",
                category: undefined,
                order: "desc",
                search: undefined,
              }}
              className="hover:text-foreground"
            >
              {t("products")}
            </Link>
            <Link
              to="/events"
              search={{ page: 1, search: undefined, region: undefined }}
              className="hover:text-foreground"
            >
              {t("events")}
            </Link>
            <Link
              to="/offers"
              search={{ page: 1, search: undefined, category: undefined }}
              className="hover:text-foreground"
            >
              {t("offers")}
            </Link>
            <Link
              to="/farms"
              search={{ page: 1, category: undefined, search: undefined }}
              className="hover:text-foreground"
            >
              {t("farms")}
            </Link>
            <Link to="/orders" className="hover:text-foreground">
              {t("orderLookup.nav")}
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

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
