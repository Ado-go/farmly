type TipsPanelProps = {
  title: string;
  description: string;
  tips: string[];
};

export function TipsPanel({ title, description, tips }: TipsPanelProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip}
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-md"
          >
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
            <p className="text-sm leading-relaxed text-foreground">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
