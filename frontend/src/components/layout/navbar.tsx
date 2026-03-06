import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FolderOpen, BookOpen, ShoppingCart, ChevronDown, UserRound, LogOut } from "lucide-react";
import { UserAvatar } from "@/components/layout/user-avatar";
import { useCartContext } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/base/ui/dropdown-menu";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const FAKE_USER = {
  id: "fake-user-1",
  name: "John Smith",
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
    <nav className="flex items-center h-navbar px-6 border-b bg-navbar shadow-xs w-full text-navbar-foreground">
      <Link to="/home" className="mr-6 flex items-center">
        <img src="/unic-logo-white.svg" alt="UNIC" className="h-7" />
      </Link>
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-navbar-muted transition-colors hover:bg-navbar-accent hover:text-navbar-active",
              location.pathname === item.to && "text-navbar-active",
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
            "relative inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-navbar-muted transition-colors hover:bg-navbar-accent hover:text-navbar-active",
            location.pathname === "/cart" && "text-navbar-active",
          )}
          title={t("navbar.cart")}
        >
          <ShoppingCart className="size-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-cta text-[10px] font-bold text-cta-foreground">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-navbar-accent transition-colors outline-none cursor-pointer">
            <UserAvatar userId={FAKE_USER.id} name={FAKE_USER.name} />
            <span className="font-medium">{FAKE_USER.name}</span>
            <ChevronDown className="size-3.5 text-navbar-muted" />
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
