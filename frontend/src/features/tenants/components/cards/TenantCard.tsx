"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Globe, MoreVertical, Edit2 } from "lucide-react";
import { TenantAvatar } from "../ui/TenantAvatar";
import { TenantStatusBadge, type TenantStatus } from "../ui/TenantStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface TenantCardProps {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  userCount: number;
  plan: string;
  onEdit?: () => void;
  onManage?: () => void;
}

export function TenantCard({
  id,
  name,
  subdomain,
  status,
  userCount,
  plan,
  onEdit,
  onManage: _onManage,
}: TenantCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <TenantAvatar name={name} size="md" />
          <div>
            <h3 className="font-semibold leading-none tracking-tight">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {subdomain}.example.com
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TenantStatusBadge status={status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/platform/tenants/${id}`}>
                  View Workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plan</span>
            <span className="text-sm font-medium">{plan}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Users</span>
            <span className="text-sm font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {userCount}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 border-t border-border/40 mt-auto flex items-center justify-between">
        <div className="text-xs text-muted-foreground pt-4">
          ID: {id.substring(0, 8)}...
        </div>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={`/platform/tenants/${id}`}>Manage Tenant</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
