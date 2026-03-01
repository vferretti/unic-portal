import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LangSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async () => {
    setIsLoading(true);
    try {
      await i18n.changeLanguage(i18n.language === "en" ? "fr" : "en");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={cn("px-3 text-sm text-muted-foreground", className)}
      disabled={isLoading}
      onClick={handleLanguageChange}
    >
      {i18n.language === "en" ? "FR" : "EN"}
    </Button>
  );
}
