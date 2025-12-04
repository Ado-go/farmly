import { AlertTriangle } from "lucide-react";

type AlertBannerProps = {
  title: string;
  message: string;
};

export function AlertBanner({ title, message }: AlertBannerProps) {
  return (
    <section
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive-foreground shadow-sm"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </section>
  );
}
