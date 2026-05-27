"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hrApi } from "@/lib/hrApi";

const Card = ({ title, value, tone = "neutral" }: { title: string; value: any; tone?: string }) => {
  const toneColors: Record<string, string> = {
    neutral: "border-gray-200 bg-white text-gray-800",
    info: "border-blue-100 bg-blue-50 text-blue-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
    danger: "border-red-100 bg-red-50 text-red-700",
  };
  return (
    <div className={`bg-white px-4 py-4 rounded-lg shadow-sm w-56 border-l-4 ${toneColors[tone]}`}>
      <h3 className="text-gray-600 text-xs font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
};

const SmallMetric = ({ label, value, tone = "neutral" }: { label: string; value: any; tone?: string }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm">
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`text-lg font-semibold ${tone === "danger" ? "text-red-600" : tone === "success" ? "text-emerald-600" : "text-gray-800"}`}>
      {value ?? 0}
    </div>
  </div>
);

export default function HrmsRootPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      if (authLoading) return;
      try {
        setLoading(true);
        const res = await hrApi.dashboard.getStats();
        setStats(res.data || {});
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authLoading]);

  if (loading) return <div className="text-center py-8">Loading dashboard…</div>;
  if (error) return <div className="text-center py-8 text-red-600">Failed to load dashboard.</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <Card title="Total Employees" value={stats.totalEmployees} />
        <Card title="Active Employees" value={stats.activeEmployees} tone="info" />
        <Card title="On Leave Today" value={stats.onLeaveToday} tone={stats.onLeaveToday > 0 ? "danger" : "neutral"} />
        <Card title="New Joiners (MTD)" value={stats.newJoinersMTD} tone="success" />
        <Card title="Exits (MTD)" value={stats.exitsMTD} tone={stats.exitsMTD > 0 ? "danger" : "neutral"} />
        <Card title="Open Positions" value={stats.openPositions} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <SmallMetric label="Present Today" value={stats.presentToday} />
        <SmallMetric label="Absent Today" value={stats.absentToday} tone={stats.absentToday > 0 ? "danger" : "neutral"} />
        <SmallMetric label="Late Check-ins" value={stats.lateCheckins} />
        <SmallMetric label={`Attendance % (MTD)`} value={`${stats.attendancePctMTD ?? 0}%`} />
      </div>
    </div>
  );
}
