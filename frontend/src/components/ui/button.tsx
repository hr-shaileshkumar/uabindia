import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual hierarchy variant:
   * - default    → Primary action (Save, Submit, Create)
   * - secondary  → Supporting action (Cancel, Back, Reset)
   * - outline    → Outlined with border, low fill (Preview, Export)
   * - ghost      → No background, text only (View details, Learn more)
   * - destructive → Danger/delete (Delete, Remove, Permanent Delete)
   * - success    → Affirmative actions (Approve, Activate, Check In)
   * - warning    → Caution actions (Show Deleted, Suspend, Flag)
   * - ghost-danger → Tertiary destructive, text-red (inline danger link)
   */
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "success" | "warning" | "ghost-danger";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl border border-transparent font-semibold tracking-[0.01em] shadow-sm transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[var(--erp-primary)]";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      /* ── Primary ──────────────────────────────────── */
      default:
        "bg-[var(--erp-primary)] text-white shadow-sm hover:bg-[var(--erp-primary-hover)] focus-visible:ring-offset-0",
      /* ── Secondary ────────────────────────────────── */
      secondary:
        "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 border border-slate-200/80 focus-visible:ring-slate-400",
      /* ── Outline ──────────────────────────────────── */
      outline:
        "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-offset-0",
      /* ── Ghost / Tertiary ─────────────────────────── */
      ghost:
        "border-transparent bg-transparent text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900",
      /* ── Destructive ──────────────────────────────── */
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 focus-visible:ring-offset-0",
      /* ── Success / Approve / Activate ─────────────── */
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600/20 focus-visible:ring-emerald-500",
      /* ── Warning / Caution ────────────────────────── */
      warning:
        "bg-amber-500 text-white hover:bg-amber-600 border border-amber-500/20 focus-visible:ring-amber-400",
      /* ── Ghost-Danger / Tertiary Destructive ──────── */
      "ghost-danger":
        "border-transparent bg-transparent text-red-600 shadow-none hover:bg-red-50 hover:text-red-700",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-sm",
      /* Square icon-only button */
      icon: "h-9 w-9 p-0 rounded-xl shadow-sm",
    };

    return (
      <button
        data-erp-button="true"
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
