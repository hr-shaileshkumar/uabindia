"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { Cpu, Wifi, Copy, Check, Play, Activity, ShieldCheck, Database } from "lucide-react";

interface BiometricDevice {
  deviceId: string;
  totalPunches: number;
  lastActive: string;
  status: string;
}

interface BiometricHardwareGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPunchesIngested?: () => void;
}

export function BiometricHardwareGatewayModal({
  open,
  onOpenChange,
  onPunchesIngested,
}: BiometricHardwareGatewayModalProps) {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Test Simulator state
  const [simEmployeeCode, setSimEmployeeCode] = useState("EMP001");
  const [simPunchType, setSimPunchType] = useState<"IN" | "OUT">("IN");
  const [simDeviceId, setSimDeviceId] = useState("ZKTECO_HQ_GATE_01");
  const [simulating, setSimulating] = useState(false);

  // Heartbeat ping state
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await hrmsApi.hrms.attendance.biometric.getDevices();
      if (res?.data?.devices) {
        setDevices(res.data.devices);
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load biometric device telemetry.", "Gateway Offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchDevices();
    }
  }, [open]);

  const handleCopyWebhookUrl = () => {
    const url = `${window.location.origin}/api/v1/hrms/biometric/push`;
    void navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    notifySuccess("Biometric ingestion push URL copied to clipboard.", "Copied");
  };

  const handleTestHeartbeat = async () => {
    try {
      setPinging(true);
      setPingResult(null);
      const res = await hrmsApi.hrms.attendance.biometric.heartbeat({
        deviceId: simDeviceId,
        firmwareVersion: "v4.2.1-Enterprise",
        ipAddress: "192.168.1.120",
      });
      setPingResult(`Heartbeat Online: ${res?.data?.message || "Device reachable"}`);
      notifySuccess("Biometric hardware heartbeat acknowledged.", "Online");
    } catch (err: any) {
      notifyError(err?.message || "Device heartbeat failed.", "Offline");
    } finally {
      setPinging(false);
    }
  };

  const handleSimulatePunch = async () => {
    if (!simEmployeeCode.trim()) {
      notifyError("Please enter an employee code to simulate.", "Validation");
      return;
    }

    try {
      setSimulating(true);
      const res = await hrmsApi.hrms.attendance.biometric.pushPunches({
        deviceId: simDeviceId,
        punches: [
          {
            employeeCode: simEmployeeCode.trim(),
            punchType: simPunchType,
            timestamp: new Date().toISOString(),
            deviceId: simDeviceId,
          },
        ],
      });

      notifySuccess(
        `Biometric punch ingested: ${res?.data?.processed ?? 1} processed successfully.`,
        "Hardware Ingested"
      );
      void fetchDevices();
      onPunchesIngested?.();
    } catch (err: any) {
      notifyError(err?.message || "Failed to ingest biometric punch.", "Ingestion Error");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Biometric IoT Gateway & Hardware Fleet
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct integration hub for ZKTeco, eSSL, Matrix Comsec, and Suprema facial & fingerprint terminals.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Integration Credentials Card */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 my-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Push Webhook Endpoint for Biometric Middleware
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Configure your device ADMS / Cloud Server setting to push punch batches via JSON payloads.
              </p>
            </div>
            <button
              onClick={handleCopyWebhookUrl}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? "Copied Endpoint!" : "Copy Webhook URL"}
            </button>
          </div>
          <div className="mt-3 font-mono text-[11px] bg-slate-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto select-all">
            POST /api/v1/hrms/biometric/push
          </div>
        </div>

        {/* Fleet Hardware Devices */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-slate-400" />
              Connected Biometric Terminal Fleet ({devices.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {devices.length > 0 ? (
              devices.map((dev, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {dev.deviceId}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {dev.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Total Punches:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dev.totalPunches}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Last active: {new Date(dev.lastActive).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
                No external biometric devices have pushed punches yet. Use the test simulator below to register a test terminal.
              </div>
            )}
          </div>
        </div>

        {/* Interactive Ingestion Simulator */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 my-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Biometric Hardware Punch Ingestion Simulator
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Employee Code</label>
              <input
                type="text"
                value={simEmployeeCode}
                onChange={(e) => setSimEmployeeCode(e.target.value)}
                placeholder="e.g. EMP001"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Punch Direction</label>
              <select
                value={simPunchType}
                onChange={(e) => setSimPunchType(e.target.value as "IN" | "OUT")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="IN">IN (Entry Punch)</option>
                <option value="OUT">OUT (Exit Punch)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Terminal Identifier</label>
              <input
                type="text"
                value={simDeviceId}
                onChange={(e) => setSimDeviceId(e.target.value)}
                placeholder="Terminal Name / Serial"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => void handleSimulatePunch()}
              disabled={simulating}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {simulating ? "Ingesting Payload..." : "Simulate IoT Hardware Punch"}
            </button>

            <button
              onClick={() => void handleTestHeartbeat()}
              disabled={pinging}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
              <Wifi className="h-3.5 w-3.5 text-indigo-500" />
              {pinging ? "Pinging..." : "Test Device Heartbeat"}
            </button>

            {pingResult && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ml-2">
                {pingResult}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
