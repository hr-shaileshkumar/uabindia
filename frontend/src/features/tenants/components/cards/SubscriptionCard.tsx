"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { erpButtonClassName } from "@/components/workspace/styles";

interface SubscriptionCardProps {
  planName: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  billingCycle: "monthly" | "yearly";
  nextBillingDate?: string;
  amount?: number;
  currency?: string;
  onManage?: () => void;
  onUpgrade?: () => void;
}

export function SubscriptionCard({
  planName,
  status,
  billingCycle,
  nextBillingDate,
  amount,
  currency = "USD",
  onManage,
  onUpgrade,
}: SubscriptionCardProps) {
  
  const isHealthy = status === "active" || status === "trialing";

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Subscription Details</CardTitle>
          </div>
          <Badge 
            variant={status === "past_due" ? "destructive" : "secondary"}
            className={isHealthy ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-transparent" : ""}
          >
            {status.replace("_", " ")}
          </Badge>
        </div>
        <CardDescription>Current billing plan and cycle</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{planName}</span>
          <span className="text-sm text-muted-foreground uppercase tracking-wide">Plan</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Billing Cycle</span>
            <span className="font-medium capitalize">{billingCycle}</span>
          </div>
          {amount !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recurring Amount</span>
              <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}</span>
            </div>
          )}
          {nextBillingDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next Invoice</span>
              <span className="font-medium flex items-center gap-1.5">
                {isHealthy ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                {nextBillingDate}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t flex items-center justify-end gap-2">
        {onManage && (
          <Button variant="outline" size="sm" onClick={onManage}>
            Manage Billing
          </Button>
        )}
        {onUpgrade && (
          <Button size="sm" onClick={onUpgrade} className={erpButtonClassName.primary}>
            Upgrade Plan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
