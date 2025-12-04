import { Sparkles } from "lucide-react";

type TipsPanelProps = {
  label: string;
  title: string;
  description: string;
  tips: string[];
};

export function TipsPanel({ label, title, description, tips }: TipsPanelProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border bg-primary/5 p-6 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-4 w-4" />
          {label}
        </div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip}
            className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white/80 p-3"
          >
            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-sm leading-relaxed text-foreground">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
