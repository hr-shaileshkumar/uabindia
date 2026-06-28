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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", type = "button", asChild = false, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl border border-transparent font-semibold tracking-[0.01em] shadow-sm transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[var(--erp-primary)]";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      /* ── Primary ──────────────────────────────────── */
      default:
        "border border-[#0d5f74]/50 bg-[linear-gradient(135deg,#163653,#0f6178_62%,#12808a)] text-white shadow-[0_14px_32px_rgba(15,54,83,0.18)] hover:brightness-105 focus-visible:ring-offset-0",
      /* ── Secondary ────────────────────────────────── */
      secondary:
        "border border-[#d9e1e7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,246,239,0.94))] text-[#173248] shadow-[0_10px_22px_rgba(15,23,42,0.06)] hover:border-[#bcc8d1] hover:bg-white focus-visible:ring-slate-400",
      /* ── Outline ──────────────────────────────────── */
      outline:
        "border border-[#d9e1e7] bg-white/92 text-[#173248] hover:border-[#bcc8d1] hover:bg-white focus-visible:ring-offset-0",
      /* ── Ghost / Tertiary ─────────────────────────── */
      ghost:
        "border-transparent bg-transparent text-[#556574] shadow-none hover:bg-white/80 hover:text-[#11263a]",
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

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: `${classes} ${String(child.props.className || "")}`.trim(),
      });
    }

    return (
      <button
        data-erp-button="true"
        type={type}
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
