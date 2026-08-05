import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className = "", icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center rounded-[var(--erp-radius-panel)] border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/30",
          className
        )}
        {...props}
      >
        {icon && <div className="mb-4 rounded-full bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">{icon}</div>}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
