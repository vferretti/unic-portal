import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-slate-300 hover:bg-white/10 hover:text-white"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-4 scale-100 dark:scale-0 transition-transform" />
      <Sun className="size-4 absolute scale-0 dark:scale-100 transition-transform" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
