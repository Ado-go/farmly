import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border bg-card/80 p-10 text-center shadow-lg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-secondary/25" />
        <div className="absolute -left-16 top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-green-100 blur-3xl" />

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <h1>404</h1>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            {t("page_not_found")}
          </h1>

          <div className="flex justify-center">
            <Button asChild>
              <Link to="/">{t("go_home")}</Link>
            </Button>
          </div>

          <div className="flex justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-muted/50 bg-white/70 px-3 py-2 shadow-sm">
              <Leaf className="h-4 w-4 text-primary" />
              <span>{t("farmly")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
