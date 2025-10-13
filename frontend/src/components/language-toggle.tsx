import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "sk" ? "en" : "sk";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {i18n.language === "sk" ? "ENG" : "SK"}
    </Button>
  );
}
