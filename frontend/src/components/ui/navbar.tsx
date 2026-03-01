import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { FolderOpen, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangSwitcher } from "@/components/ui/lang-switcher";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: t("navbar.projects"), to: "/projects", icon: <FolderOpen className="size-4" /> },
    { label: t("navbar.catalog"), to: "/catalog", icon: <BookOpen className="size-4" /> },
  ];

  return (
    <nav className="flex items-center h-navbar px-6 border-b bg-background shadow-xs w-full">
      <Link to="/" className="mr-6 flex items-center">
        <img
          src="/unic-logo-header.svg"
          alt="UNIC"
          className="h-7 dark:brightness-0 dark:invert"
        />
      </Link>
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              location.pathname === item.to && "text-primary",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <LangSwitcher />
        <ThemeToggle />
      </div>
    </nav>
  );
}
