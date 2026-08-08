import * as React from "react";
import { KPICard, type KPICardProps } from "./kpi-card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ({ title, value, description, icon, trend, className, ...props }, ref) => {
    return (
      <KPICard
        ref={ref}
        title={title}
        value={value}
        description={description}
        icon={icon}
        trend={trend ? { value: trend.value, positive: trend.positive } : undefined}
        className={className}
        {...props}
      />
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard, KPICard };
