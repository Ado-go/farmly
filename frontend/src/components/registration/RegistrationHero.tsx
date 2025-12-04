import { Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HeroBullet = {
  icon: LucideIcon;
  title: string;
  description: string;
};

interface RegistrationHeroProps {
  brand: string;
  heading: string;
  description: string;
  bulletsTitle: string;
  bullets: HeroBullet[];
}

export function RegistrationHero({
  brand,
  heading,
  description,
  bulletsTitle,
  bullets,
}: RegistrationHeroProps) {
  return (
    <div className="relative flex h-full flex-col gap-6 p-10 text-primary-foreground">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-white/15 p-3">
          <Leaf className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            {brand}
          </p>
          <p className="text-lg font-semibold text-primary-foreground">
            {heading}
          </p>
        </div>
      </div>

      <p className="max-w-md text-sm text-primary-foreground/90">
        {description}
      </p>

      <div className="grid gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-white/70">
          {bulletsTitle}
        </p>
        {bullets.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
          >
            <item.icon className="mt-0.5 h-5 w-5 text-white" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary-foreground">
                {item.title}
              </p>
              <p className="text-xs text-primary-foreground/80">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
