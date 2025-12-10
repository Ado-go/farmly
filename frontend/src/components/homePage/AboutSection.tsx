import { Sprout } from "lucide-react";

type AboutSectionProps = {
  label: string;
  title: string;
  description: string;
  point1: string;
  point2: string;
  point3: string;
  helper: string;
  helperHeadline: string;
  helperBody: string;
  badgeFair: string;
  badgeCommunity: string;
  badgeLessWaste: string;
};

export function AboutSection({
  label,
  title,
  description,
  point1,
  point2,
  point3,
  helper,
  helperHeadline,
  helperBody,
  badgeFair,
  badgeCommunity,
  badgeLessWaste,
}: AboutSectionProps) {
  return (
    <section className="grid gap-6 rounded-3xl border bg-white p-6 shadow-sm md:grid-cols-[1.1fr,0.9fr]">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {label}
        </p>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            {point1}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            {point2}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            {point3}
          </li>
        </ul>
      </div>
      <div className="flex flex-col justify-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/15 via-white to-secondary/15 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{helper}</p>
            <p className="text-lg font-semibold text-foreground">
              {helperHeadline}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {helperBody}
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
          <span className="rounded-full bg-primary/10 px-3 py-1">
            {badgeFair}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1">
            {badgeCommunity}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1">
            {badgeLessWaste}
          </span>
        </div>
      </div>
    </section>
  );
}
