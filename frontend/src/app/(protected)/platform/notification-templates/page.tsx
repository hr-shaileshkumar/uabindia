"use client";

import { useState, useMemo } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Copy, Trash2, Plus, Search, Power, PowerOff } from "lucide-react";

type ChannelType = "Email" | "SMS" | "InApp";
type StatusType = "Active" | "Draft" | "Disabled";

type TemplateRow = {
  id: string;
  name: string;
  channel: ChannelType;
  event: string;
  subject?: string;
  body: string;
  status: StatusType;
  language: string;
  updatedAt: string;
};

const SEED_TEMPLATES: TemplateRow[] = [
  { id: "1", name: "Welcome Email", channel: "Email", event: "User Created", subject: "Welcome to UAB ERP!", body: "Hi {{userName}}, welcome to the platform. Your default password is {{tempPassword}}.", status: "Active", language: "English", updatedAt: "2026-07-20T10:00:00Z" },
  { id: "2", name: "Password Reset", channel: "Email", event: "Password Reset Requested", subject: "Reset your password", body: "Click here to reset your password: {{resetLink}}", status: "Active", language: "English", updatedAt: "2026-07-21T10:00:00Z" },
  { id: "3", name: "Invoice Created", channel: "Email", event: "Invoice Generated", subject: "New Invoice #{{invoiceNo}}", body: "Dear {{customerName}}, your invoice for {{amount}} has been generated. Please find it attached.", status: "Active", language: "English", updatedAt: "2026-07-22T10:00:00Z" },
  { id: "4", name: "Payment Received", channel: "SMS", event: "Payment Received", body: "Payment of {{amount}} received for invoice {{invoiceNo}}. Thank you!", status: "Active", language: "English", updatedAt: "2026-07-22T11:00:00Z" },
  { id: "5", name: "Leave Approved", channel: "InApp", event: "Leave Request Approved", body: "Your leave from {{startDate}} to {{endDate}} has been approved by {{managerName}}.", status: "Active", language: "English", updatedAt: "2026-07-22T12:00:00Z" },
  { id: "6", name: "Ticket Assigned", channel: "Email", event: "Support Ticket Assigned", subject: "Ticket #{{ticketId}} assigned to you", body: "Hello {{agentName}}, a new ticket has been assigned to you. Priority: {{priority}}.", status: "Draft", language: "English", updatedAt: "2026-07-23T10:00:00Z" },
  { id: "7", name: "Subscription Expiry Warning", channel: "Email", event: "Subscription Expiring", subject: "Action Required: Subscription expiring soon", body: "Your subscription expires on {{expiryDate}}. Please renew to avoid service interruption.", status: "Disabled", language: "English", updatedAt: "2026-07-15T10:00:00Z" },
  { id: "8", name: "Role Changed", channel: "InApp", event: "User Role Updated", body: "Your role has been updated to {{newRole}}.", status: "Active", language: "English", updatedAt: "2026-07-20T14:00:00Z" },
  { id: "9", name: "Leave Rejected", channel: "InApp", event: "Leave Request Rejected", body: "Your leave from {{startDate}} to {{endDate}} was rejected. Reason: {{reason}}.", status: "Active", language: "Hindi", updatedAt: "2026-07-21T12:00:00Z" },
];

const PREDEFINED_EVENTS = [
  "User Created",
  "User Role Updated",
  "Password Reset Requested",
  "Invoice Generated",
  "Payment Received",
  "Leave Request Approved",
  "Leave Request Rejected",
  "Support Ticket Assigned",
  "Subscription Expiring",
  "System Alert",
];

export default function NotificationTemplatesPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [records, setRecords] = useState<TemplateRow[]>(SEED_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<"All" | ChannelType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | StatusType>("All");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TemplateRow | null>(null);

  const [formData, setFormData] = useState<Partial<TemplateRow>>({
    name: "",
    channel: "Email",
    event: "User Created",
    subject: "",
    body: "",
    status: "Draft",
    language: "English"
  });

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.event.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = channelFilter === "All" || r.channel === channelFilter;
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [records, searchQuery, channelFilter, statusFilter]);

  const handleCreate = () => {
    setEditingRecord(null);
    setFormData({
      name: "",
      channel: "Email",
      event: "User Created",
      subject: "",
      body: "",
      status: "Draft",
      language: "English"
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: TemplateRow) => {
    setEditingRecord(record);
    setFormData(record);
    setIsDrawerOpen(true);
  };

  const handleClone = (record: TemplateRow) => {
    const newRecord: TemplateRow = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      name: `${record.name} (Copy)`,
      status: "Draft",
      updatedAt: new Date().toISOString(),
    };
    setRecords([newRecord, ...records]);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete Template",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (ok) {
      setRecords(records.filter((r) => r.id !== id));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: StatusType) => {
    if (currentStatus === "Disabled") return; // Keep disabled as disabled unless edited
    const newStatus = currentStatus === "Active" ? "Draft" : "Active";
    setRecords(
      records.map((r) => (r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r))
    );
  };

  const handleSave = () => {
    if (!formData.name || !formData.body) return;

    if (editingRecord) {
      setRecords(
        records.map((r) =>
          r.id === editingRecord.id
            ? { ...r, ...formData, updatedAt: new Date().toISOString() } as TemplateRow
            : r
        )
      );
    } else {
      const newRecord: TemplateRow = {
        ...(formData as TemplateRow),
        id: Math.random().toString(36).substr(2, 9),
        updatedAt: new Date().toISOString(),
      };
      setRecords([newRecord, ...records]);
    }
    setIsDrawerOpen(false);
  };

  const getChannelColor = (channel: ChannelType) => {
    switch (channel) {
      case "Email": return "bg-blue-100 text-blue-800 border-blue-200";
      case "SMS": return "bg-amber-100 text-amber-800 border-amber-200";
      case "InApp": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-200";
      case "Draft": return "bg-slate-100 text-slate-800 border-slate-200";
      case "Disabled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <StandardPageLayout
      title="Notification Templates"
      subtitle="Create and manage email, SMS, and in-app notification templates for system events."
      eyebrow="Platform / Configuration"
      icon="bell"
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Template
        </Button>
      }
      filters={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="search" className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="search"
                placeholder="Search by name or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="channelFilter" className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Channel</Label>
            <Select value={channelFilter} onValueChange={(val: any) => setChannelFilter(val)}>
              <SelectTrigger id="channelFilter">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Channels</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="InApp">In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="statusFilter" className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Status</Label>
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      {confirmDialog}

      <div className="mb-6">
        <ErpHeaderSummary
          items={[
            { label: "Total Templates", value: records.length },
            {
              label: "Email",
              value: records.filter((record) => record.channel === "Email").length,
              tone: "info",
            },
            {
              label: "SMS",
              value: records.filter((record) => record.channel === "SMS").length,
              tone: "warning",
            },
            {
              label: "In-App",
              value: records.filter((record) => record.channel === "InApp").length,
              tone: "success",
            },
            {
              label: "Active",
              value: records.filter((record) => record.status === "Active").length,
              tone: "default",
            },
          ]}
        />
      </div>

      <div className="erp-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table w-full">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Template Name</th>
                <th className="erp-th">Channel</th>
                <th className="erp-th">Event Trigger</th>
                <th className="erp-th">Language</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No templates found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="erp-tr group hover:bg-slate-50">
                    <td className="erp-td font-medium text-slate-900">
                      {r.name}
                      {r.subject && <div className="text-xs font-normal text-slate-500 mt-1 line-clamp-1">{r.subject}</div>}
                    </td>
                    <td className="erp-td">
                      <Badge variant="outline" className={getChannelColor(r.channel)}>
                        {r.channel}
                      </Badge>
                    </td>
                    <td className="erp-td text-sm text-slate-600">{r.event}</td>
                    <td className="erp-td text-sm text-slate-600">{r.language}</td>
                    <td className="erp-td">
                      <Badge variant="outline" className={getStatusColor(r.status)}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="erp-td text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {r.status !== "Disabled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900"
                            onClick={() => handleToggleStatus(r.id, r.status)}
                            title={r.status === "Active" ? "Set to Draft" : "Set to Active"}
                          >
                            {r.status === "Active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => handleEdit(r)}
                          title="Edit Template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-green-600"
                          onClick={() => handleClone(r)}
                          title="Clone Template"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => handleDelete(r.id, r.name)}
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingRecord ? "Edit Template" : "Create Template"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Welcome Email"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel *</Label>
                <Select value={formData.channel} onValueChange={(val) => setFormData({ ...formData, channel: val as ChannelType, subject: val !== "Email" ? "" : formData.subject })}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="InApp">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Event Trigger *</Label>
              <Select value={formData.event} onValueChange={(val) => setFormData({ ...formData, event: val })}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_EVENTS.map(ev => (
                    <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as StatusType })}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.channel === "Email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Welcome to {{companyName}}"
                  value={formData.subject || ""}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label htmlFor="body">Message Body *</Label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Use {'{{variable}}'} for dynamic data</span>
              </div>
              <textarea
                id="body"
                className="flex min-h-[200px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Hello {{userName}},\n\nYour message here...`}
                value={formData.body || ""}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.body || (formData.channel === 'Email' && !formData.subject)}>
                {editingRecord ? "Save Changes" : "Create Template"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </StandardPageLayout>
  );
}
