import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RegistrationRole } from "@/types/registration";

type RoleCard = {
  value: RegistrationRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

interface RoleSelectionProps {
  label: string;
  description: string;
  activeLabel: string;
  roles: RoleCard[];
  selectedRole: RegistrationRole;
  onSelect: (value: RegistrationRole) => void;
}

export function RoleSelection({
  label,
  description,
  activeLabel,
  roles,
  selectedRole,
  onSelect,
}: RoleSelectionProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">
            {label}
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm">
          {activeLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {roles.map((roleCard) => {
          const Icon = roleCard.icon;
          const active = selectedRole === roleCard.value;

          return (
            <button
              key={roleCard.value}
              type="button"
              onClick={() => onSelect(roleCard.value)}
              className={cn(
                "group flex h-full flex-col gap-3 rounded-xl border bg-white px-4 pb-3 pt-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                active
                  ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30"
                  : "border-primary/15"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-full p-2 transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {roleCard.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleCard.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
