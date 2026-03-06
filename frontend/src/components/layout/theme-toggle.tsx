import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/base/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-navbar-muted hover:bg-navbar-accent hover:text-navbar-active"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-4 scale-100 dark:scale-0 transition-transform" />
      <Sun className="size-4 absolute scale-0 dark:scale-100 transition-transform" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
