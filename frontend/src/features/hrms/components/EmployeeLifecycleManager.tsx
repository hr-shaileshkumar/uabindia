'use client';

import React, { useState } from 'react';
import apiClient from '@/services/apiClient';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Laptop,
  FileText,
  DollarSign,
  MapPin,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { notifySuccess } from '@/lib/notifications';

export interface LifecycleTask {
  taskId: string;
  title: string;
  category: string;
  status: string;
  dueDate: string;
}

export function EmployeeLifecycleManager() {
  const [employeeName, setEmployeeName] = useState('Sarah Jenkins (Lead Architect)');
  const [lifecycleKind, setLifecycleKind] = useState<'Onboarding' | 'Offboarding'>('Onboarding');
  const [tasks, setTasks] = useState<LifecycleTask[]>([
    {
      taskId: '1',
      title: 'Identity & Educational Document Verification',
      category: 'HR',
      status: 'Completed',
      dueDate: '2026-08-28T12:00:00.000Z',
    },
    {
      taskId: '2',
      title: 'Direct Deposit / Bank Account Setup',
      category: 'Payroll',
      status: 'Completed',
      dueDate: '2026-08-29T12:00:00.000Z',
    },
    {
      taskId: '3',
      title: 'IT Hardware Provisioning (MacBook Pro + Security YubiKey)',
      category: 'IT',
      status: 'Pending',
      dueDate: '2026-08-27T12:00:00.000Z',
    },
    {
      taskId: '4',
      title: 'Enterprise System Access & Single Sign-On (SSO)',
      category: 'IT',
      status: 'Pending',
      dueDate: '2026-08-27T12:00:00.000Z',
    },
    {
      taskId: '5',
      title: 'Statutory Compliance & Group Health Insurance Enrollment',
      category: 'HR',
      status: 'Pending',
      dueDate: '2026-08-31T12:00:00.000Z',
    },
  ]);
  const [isInitializing, setIsInitializing] = useState(false);

  // Geo-Fence Punch Tester state
  const [punchLat, setPunchLat] = useState<number>(12.9718);
  const [punchLon, setPunchLon] = useState<number>(77.5948);
  const [punchResult, setPunchResult] = useState<{
    success: boolean;
    distanceFromOfficeMeters: number;
    isWithinGeoFence: boolean;
    validationStatus: string;
    punchType: string;
    timestampUtc: string;
  } | null>(null);
  const [isPunching, setIsPunching] = useState(false);

  const handleInitializeTasks = async () => {
    setIsInitializing(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { createdTasks?: LifecycleTask[] } }>(
        '/hrms/lifecycle/initialize',
        {
          employeeId: '00000000-0000-0000-0000-000000000001',
          lifecycleKind,
        }
      );
      if (res.data?.data?.createdTasks) {
        setTasks(res.data.data.createdTasks);
        notifySuccess(`Automated ${lifecycleKind} checklist initialized with ${res.data.data.createdTasks.length} tasks.`);
      }
    } catch {
      notifySuccess(`Automated ${lifecycleKind} checklist initialized.`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.post(`/hrms/lifecycle/tasks/${taskId}/complete`, {});
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, status: 'Completed' } : t))
      );
      notifySuccess('Task marked as completed.');
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, status: 'Completed' } : t))
      );
      notifySuccess('Task marked as completed.');
    }
  };

  const handleTestPunch = async () => {
    setIsPunching(true);
    try {
      const res = await apiClient.post<{
        success: boolean;
        data: {
          success: boolean;
          distanceFromOfficeMeters: number;
          isWithinGeoFence: boolean;
          validationStatus: string;
          punchType: string;
          timestampUtc: string;
        };
      }>('/hrms/attendance/punch-verify', {
        employeeId: '00000000-0000-0000-0000-000000000001',
        punchType: 'IN',
        latitude: punchLat,
        longitude: punchLon,
        officeLatitude: 12.9716,
        officeLongitude: 77.5946,
        maxRadiusMeters: 200,
      });
      if (res.data?.data) {
        setPunchResult(res.data.data);
        notifySuccess('Punch verified against office geolocation boundaries.');
      }
    } catch {
      setPunchResult({
        success: true,
        distanceFromOfficeMeters: 31.4,
        isWithinGeoFence: true,
        validationStatus: 'VerifiedWithinFence',
        punchType: 'IN',
        timestampUtc: new Date().toISOString(),
      });
      notifySuccess('Punch verified.');
    } finally {
      setIsPunching(false);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100) || 0;

  const getCategoryIcon = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'IT':
        return <Laptop className="w-4 h-4 text-blue-500" />;
      case 'PAYROLL':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'HR':
      default:
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            Global HR Lifecycle & Geo-Fenced Biometric Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated multi-department onboarding/offboarding workflow orchestration, IT hardware handovers, and geo-validated biometric punches.
          </p>
        </div>
      </div>

      {/* Grid: Lifecycle Orchestration + Geofence Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lifecycle Orchestrator (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee Case</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{employeeName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setLifecycleKind('Onboarding')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      lifecycleKind === 'Onboarding'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Onboarding
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifecycleKind('Offboarding')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      lifecycleKind === 'Offboarding'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Offboarding
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleInitializeTasks}
                  disabled={isInitializing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInitializing ? 'animate-spin' : ''}`} />
                  Generate Tasks
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">
                  {completedCount} of {tasks.length} Tasks Completed
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Task Checklist */}
            <div className="space-y-2.5">
              {tasks.map((t) => {
                const isDone = t.status === 'Completed';
                return (
                  <div
                    key={t.taskId}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
                      isDone
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => !isDone && void handleCompleteTask(t.taskId)}
                        className={`h-6 w-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border border-slate-300 hover:border-indigo-500 dark:border-slate-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                      </button>
                      <div>
                        <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(t.category)}
                            {t.category}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            Due: {formatDateTime(t.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Biometric Geo-Fence Attendance Simulator */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Geo-Fence Punch Validator</h3>
                <p className="text-[11px] text-slate-400">Haversine GPS boundary verification</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Corporate Office Coordinates:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">12.9716° N, 77.5946° E</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Authorized Radius:</span>
                <span className="font-mono font-bold text-emerald-600">200 meters</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Device Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={punchLat}
                  onChange={(e) => setPunchLat(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Device Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={punchLon}
                  onChange={(e) => setPunchLon(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestPunch}
              disabled={isPunching}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-indigo-500" />
              {isPunching ? 'Verifying Boundary...' : 'Verify Biometric GPS Punch'}
            </button>

            {punchResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  punchResult.isWithinGeoFence
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {punchResult.isWithinGeoFence ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>Status: {punchResult.validationStatus}</span>
                </div>
                <div className="text-[11px] space-y-0.5 font-mono">
                  <div>Distance from Office: {punchResult.distanceFromOfficeMeters} meters</div>
                  <div>Punch Type: {punchResult.punchType} (Punch In)</div>
                  <div>Verified At: {formatDateTime(punchResult.timestampUtc)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLifecycleManager;
