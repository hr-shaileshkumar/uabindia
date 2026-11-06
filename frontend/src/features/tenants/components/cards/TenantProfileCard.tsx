"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";

interface TenantProfileCardProps {
  tenant: {
    name: string;
    adminName: string;
    adminEmail: string;
    contactNumber?: string;
    address?: string;
    createdAt: string;
    plan: string;
  };
}

export function TenantProfileCard({ tenant }: TenantProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tenant Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Primary Contact</p>
              <p className="text-sm text-muted-foreground">{tenant.adminName}</p>
              <p className="text-sm text-muted-foreground">{tenant.adminEmail}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Phone</p>
              <p className="text-sm text-muted-foreground">{tenant.contactNumber || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Location</p>
              <p className="text-sm text-muted-foreground">{tenant.address || "No address on file"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Subscription Plan</p>
              <p className="text-sm text-muted-foreground">{tenant.plan}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Customer Since</p>
              <p className="text-sm text-muted-foreground">{tenant.createdAt}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
