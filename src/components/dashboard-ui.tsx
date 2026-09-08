import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  ContactRound,
  MapPinned,
  Phone,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { ModuleType } from "@/lib/domain";

const toolIcons: Record<ModuleType, LucideIcon> = {
  CALL_WHATSAPP: Phone,
  QUOTE_REQUEST: ClipboardList,
  PRICING: BadgeDollarSign,
  SERVICE_AREA: MapPinned,
  TRUST: ShieldCheck,
  FAQ: CircleHelp,
  REVIEW: Star,
  SAVE_CONTACT: ContactRound,
};

export function ToolIcon({ type }: { type: ModuleType }) {
  const Icon = toolIcons[type];
  return (
    <span
      className={`tool-icon tool-icon-${type.toLowerCase()}`}
      aria-hidden="true"
    >
      <Icon size={24} strokeWidth={1.8} />
    </span>
  );
}

export function PageHeader({
  title,
  intro,
  eyebrow,
  action,
}: {
  title: string;
  intro: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}

export function StatusBadge({
  on,
  onLabel = "Enabled",
  offLabel = "Off",
}: {
  on: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <span className={`status-badge ${on ? "status-on" : "status-off"}`}>
      <span aria-hidden="true" /> {on ? onLabel : offLabel}
    </span>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <CheckCircle2 aria-hidden="true" size={26} strokeWidth={1.6} />
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-card ${className}`.trim()}>{children}</section>
  );
}

export function ToolEditorShell({
  type,
  title,
  intro,
  children,
  aside,
  fullWidth = false,
  statusControl,
  backHref = "/dashboard/tools",
  backLabel = "All tools",
}: {
  type: ModuleType;
  title: string;
  intro: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  fullWidth?: boolean;
  statusControl?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="dashboard-page tool-editor-page">
      <Link className="back-link" href={backHref}>
        <ArrowLeft size={17} aria-hidden="true" /> {backLabel}
      </Link>
      <header className="tool-editor-header">
        <ToolIcon type={type} />
        <div>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        {statusControl}
      </header>
      <div
        className={
          aside
            ? "tool-editor-layout"
            : fullWidth
              ? "tool-editor-workspace"
              : "tool-editor-centered"
        }
      >
        <div className="tool-editor-main">{children}</div>
        {aside && <aside className="tool-editor-aside">{aside}</aside>}
      </div>
    </main>
  );
}
