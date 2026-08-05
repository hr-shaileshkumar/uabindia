"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Phone, Building2, Briefcase, Calendar, MapPin, Shield, FileText, CheckCircle2, Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Employee } from "@/types";

interface EmployeeDetailProps {
  employee: Employee;
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName || "Employee Details"}
        subtitle={`Employee Code: ${employee.employeeCode || "N/A"}`}
        backHref="/hrms/employees"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Employees", href: "/hrms/employees" },
          { label: employee.fullName || "Details" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/hrms/employees/${employee.id}/edit`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        }
      />

      {/* Header Banner Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-full border-4 border-background bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {(employee.fullName || "E").charAt(0).toUpperCase()}
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-bold text-foreground">{employee.fullName || "Unnamed Employee"}</h2>
                <p className="text-xs text-muted-foreground">{employee.designationName || "No Designation"} • {employee.departmentName || "No Department"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={employee.status === "Active" ? "success" : "secondary"}>
                {employee.status || "Active"}
              </Badge>
              <Badge variant="outline">{employee.employmentType || "Full-Time"}</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-4 border-t border-border text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="truncate">{employee.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>{employee.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>Joined: {employee.joiningDate || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>{employee.workLocation || "Main Office"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="job">Job & Organization</TabsTrigger>
          <TabsTrigger value="attendance">Attendance & Leave</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{employee.gender || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">{employee.dateOfBirth || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-xs">{employee.address || "Not specified"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Manager & Reporting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Reporting Manager</span>
                  <span className="font-medium">{employee.managerName || "Direct Reporting"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{employee.departmentName || "Unassigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Designation Level</span>
                  <span className="font-medium">{employee.designationName || "L1 Member"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="job" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Job Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Employee Code</p>
                  <p className="font-medium">{employee.employeeCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employment Status</p>
                  <p className="font-medium">{employee.status || "Active"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{employee.joiningDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Work Location</p>
                  <p className="font-medium">{employee.workLocation || "Head Office"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Attendance & Leave Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Present This Month</p>
                  <p className="text-2xl font-bold text-emerald-600">19 Days</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Leave Taken</p>
                  <p className="text-2xl font-bold text-amber-600">2 Days</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Casual Leave Remaining</p>
                  <p className="text-2xl font-bold text-indigo-600">10 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Government ID / Passport.pdf</p>
                    <p className="text-xs text-muted-foreground">Uploaded on onboarding</p>
                  </div>
                </div>
                <Badge variant="outline">Verified</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Employment Agreement.pdf</p>
                    <p className="text-xs text-muted-foreground">Signed & Stored</p>
                  </div>
                </div>
                <Badge variant="outline">Signed</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
