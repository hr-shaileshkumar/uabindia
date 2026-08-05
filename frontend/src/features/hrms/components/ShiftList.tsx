"use client";

import { useState } from "react";
import { Clock, Plus, Edit2, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ShiftItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // in minutes
  isNightShift: boolean;
  isActive: boolean;
}

const INITIAL_SHIFTS: ShiftItem[] = [
  { id: "1", name: "General Day Shift", startTime: "09:00 AM", endTime: "06:00 PM", breakDuration: 60, isNightShift: false, isActive: true },
  { id: "2", name: "Early Morning Shift", startTime: "06:00 AM", endTime: "03:00 PM", breakDuration: 45, isNightShift: false, isActive: true },
  { id: "3", name: "Evening Shift", startTime: "02:00 PM", endTime: "11:00 PM", breakDuration: 60, isNightShift: false, isActive: true },
  { id: "4", name: "Night Shift", startTime: "10:00 PM", endTime: "07:00 AM", breakDuration: 60, isNightShift: true, isActive: true },
];

export function ShiftList() {
  const [shifts, setShifts] = useState<ShiftItem[]>(INITIAL_SHIFTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    breakDuration: 60,
    isNightShift: false,
  });

  const handleOpenDrawer = (shift?: ShiftItem) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakDuration: shift.breakDuration,
        isNightShift: shift.isNightShift,
      });
    } else {
      setEditingShift(null);
      setFormData({ name: "", startTime: "09:00 AM", endTime: "06:00 PM", breakDuration: 60, isNightShift: false });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingShift) {
      setShifts((prev) =>
        prev.map((s) => (s.id === editingShift.id ? { ...s, ...formData } : s))
      );
    } else {
      const newShift: ShiftItem = {
        id: String(Date.now()),
        ...formData,
        isActive: true,
      };
      setShifts((prev) => [...prev, newShift]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift & Roster Management"
        subtitle="Configure work shifts, timings, break durations, and night rosters"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Shifts" },
        ]}
        actions={
          <Button size="sm" onClick={() => handleOpenDrawer()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shifts.map((shift) => (
          <Card key={shift.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {shift.isNightShift ? (
                  <Moon className="h-5 w-5 text-indigo-500 shrink-0" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <CardTitle className="text-base font-semibold">{shift.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {shift.startTime} - {shift.endTime}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={shift.isNightShift ? "secondary" : "outline"}>
                {shift.isNightShift ? "Night" : "Day"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Break Duration</span>
                <span className="font-medium">{shift.breakDuration} mins</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="ghost" onClick={() => handleOpenDrawer(shift)} className="h-8 px-2 text-xs">
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingShift ? "Edit Shift" : "Create Shift"}
        subtitle="Set shift hours and break policies"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Shift</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shiftName">Shift Name *</Label>
            <Input
              id="shiftName"
              placeholder="e.g. General Day Shift"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                placeholder="09:00 AM"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                placeholder="06:00 PM"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="break">Break Duration (Minutes)</Label>
            <Input
              id="break"
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
            />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
