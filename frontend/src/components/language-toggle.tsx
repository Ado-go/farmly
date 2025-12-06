import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "sk" ? "en" : "sk";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className={cn(
        "h-10 w-10 flex-col rounded-full border border-muted/60 bg-card/80 px-0 shadow-sm hover:bg-primary/10",
        className
      )}
      aria-label="Toggle language"
    >
      <span className="text-[11px] font-semibold leading-none tracking-wide">
        {i18n.language === "sk" ? "SK" : "EN"}
      </span>
    </Button>
  );
}
