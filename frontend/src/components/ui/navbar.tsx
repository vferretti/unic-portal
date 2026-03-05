import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FolderOpen, BookOpen, ShoppingCart, ChevronDown, UserRound, LogOut } from "lucide-react";
import { useCartContext } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangSwitcher } from "@/components/ui/lang-switcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const FAKE_USER = {
  name: "John Smith",
  initials: "JS",
  email: "John.Smith.hsj@ssss.gouv.qc.ca",
};

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { count: cartCount } = useCartContext();

  const navItems: NavItem[] = [
    { label: t("navbar.projects"), to: "/projects", icon: <FolderOpen className="size-4" /> },
    { label: t("navbar.catalog"), to: "/catalog", icon: <BookOpen className="size-4" /> },
  ];

  return (
    <nav className="flex items-center h-navbar px-6 border-b bg-navbar shadow-xs w-full">
      <Link to="/home" className="mr-6 flex items-center">
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
        <Link
          to="/cart"
          className={cn(
            "relative inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            location.pathname === "/cart" && "text-primary",
          )}
          title={t("navbar.cart")}
        >
          <ShoppingCart className="size-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors outline-none cursor-pointer">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {FAKE_USER.initials}
            </span>
            <span className="font-medium">{FAKE_USER.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {t("user_menu.connected_as", { email: FAKE_USER.email })}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserRound />
              {t("user_menu.profile_settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/")}>
              <LogOut />
              {t("user_menu.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <LangSwitcher />
        <ThemeToggle />
      </div>
    </nav>
  );
}
