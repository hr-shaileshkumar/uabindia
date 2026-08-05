import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className = "", title, value, description, icon, trend, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && (
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && <p className="text-xs text-slate-500">{description}</p>}
          {trend && (
            <p className={`text-xs ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value} from last month
            </p>
          )}
        </CardContent>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-20 dark:from-indigo-500/10" />
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
