"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronRight,
  CreditCard,
  FileText,
  House,
  LifeBuoy,
  Menu,
  PanelTop,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { AccountProfileControl } from "@/components/account-profile-control";

const navigation = [
  { href: "/dashboard", label: "Home", icon: House, exact: true },
  { href: "/dashboard/page", label: "My Page", icon: PanelTop },
  { href: "/dashboard/tools", label: "Tools", icon: Wrench },
  { href: "/dashboard/quotes", label: "Quote Requests", icon: FileText },
  { href: "/dashboard/review-kit", label: "Review Kit", icon: Star },
  {
    href: "/dashboard/business",
    label: "Business details",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
  },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={mobile ? "mobile-nav-links" : "app-nav"}
      aria-label="Account"
    >
      {navigation.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            href={item.href}
            key={item.href}
            className={active ? "active" : undefined}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
            {mobile && <ChevronRight aria-hidden="true" size={18} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  email,
  businessName,
  children,
}: {
  email: string;
  businessName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/dashboard" className="app-wordmark">
          <span aria-hidden="true">L</span>
          LocalAction
        </Link>
        <NavigationLinks />
        <div className="sidebar-account">
          <Link
            href="/help"
            className="sidebar-help"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LifeBuoy aria-hidden="true" size={18} /> Help
          </Link>
          <AccountProfileControl email={email} businessName={businessName} />
        </div>
      </aside>

      <header className="mobile-app-bar">
        <Link href="/dashboard" className="app-wordmark">
          <span aria-hidden="true">L</span>
          LocalAction
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <Menu className="menu-open-icon" aria-hidden="true" />
            <X className="menu-close-icon" aria-hidden="true" />
          </summary>
          <div className="mobile-menu-sheet">
            <AccountProfileControl
              email={email}
              businessName={businessName}
              compact
            />
            <NavigationLinks mobile />
            <Link
              href="/help"
              className="mobile-help-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LifeBuoy aria-hidden="true" size={18} /> Help
              <ChevronRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </details>
      </header>

      <div className="app-content">{children}</div>
    </div>
  );
}
