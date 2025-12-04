import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckoutProgressProps = {
  step: number;
  steps: { label: string; helper?: string }[];
  onStepChange?: (step: number) => void;
};

export function CheckoutProgress({
  step,
  steps,
  onStepChange,
}: CheckoutProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-primary/15 bg-white/90 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {t("checkoutPage.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {step} / {steps.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t("checkoutPage.secureProcess")}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => {
            const status =
              step === index + 1
                ? "active"
                : step > index + 1
                  ? "done"
                  : "upcoming";
            const isClickable = step > index + 1 && !!onStepChange;

            return (
              <button
                key={index}
                type="button"
                onClick={() => isClickable && onStepChange?.(index + 1)}
                className={cn(
                  "group flex h-full flex-col gap-2 rounded-xl border p-3 text-left transition",
                  "hover:-translate-y-[2px] hover:shadow-md",
                  status === "active" && "border-primary/40 bg-primary/5",
                  status === "done" && "border-emerald-200 bg-emerald-50",
                  status === "upcoming" && "border-muted"
                )}
                disabled={!isClickable}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                      status === "active" && "border-primary bg-primary text-white",
                      status === "done" &&
                        "border-emerald-300 bg-emerald-500 text-white",
                      status === "upcoming" &&
                        "border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        status === "upcoming"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.helper && (
                      <span className="text-xs text-muted-foreground">
                        {item.helper}
                      </span>
                    )}
                  </div>
                </div>

                {status === "upcoming" && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Circle className="h-3 w-3" />
                    <span>{t("checkoutPage.statusAwaiting")}</span>
                  </div>
                )}
                {status === "done" && (
                  <div className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{t("checkoutPage.statusCompleted")}</span>
                  </div>
                )}
                {status === "active" && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Circle className="h-3 w-3 animate-pulse" />
                    <span>{t("checkoutPage.statusInProgress")}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
