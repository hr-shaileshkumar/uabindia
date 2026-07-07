'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionContext';
import { PERMISSIONS } from '@/constants/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';
import { notifyError, notifySuccess } from '@/lib/notifications';
import { hrApi } from '@/services/hrApi';

type OvertimeRequest = {
  id: string;
  employeeId: string;
  employeeName?: string;
  overtimeDate?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  breakMinutes?: number;
  netOvertimeHours?: number;
  reason?: string;
  projectCode?: string | null;
  overtimeType?: string;
  status?: string;
  managerName?: string | null;
  compensationType?: string;
  overtimeRate?: number;
  overtimeAmount?: number;
  approvalCount?: number;
  createdAt?: string;
};

type OvertimeLog = {
  id: string;
  employeeId: string;
  employeeName?: string;
  overtimeDate?: string;
  overtimeHours?: number;
  overtimeRate?: number;
  overtimeAmount?: number;
  overtimeType?: string;
  compensationType?: string;
  isProcessedInPayroll?: boolean;
  compensatoryLeaveHours?: number | null;
  notes?: string | null;
  createdAt?: string;
};

type OvertimeFormState = {
  employeeId: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  reason: string;
  projectCode: string;
  overtimeType: string;
  compensationType: string;
  overtimeRate: string;
  managerId: string;
  employeeNotes: string;
};

const toTimeSpan = (value: string) => {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

export default function OvertimePage() {
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const searchParams = useSearchParams();
  const employeeIdFromQuery = searchParams.get('employeeId')?.trim() || undefined;
  const activeEmployeeId = employeeIdFromQuery || user?.id;

  const canViewOvertime = isSuperAdmin || hasPermission([PERMISSIONS.OVERTIME_VIEW]);
  const canCreateOvertime = isSuperAdmin || hasPermission([PERMISSIONS.OVERTIME_CREATE]);
  const canApproveOvertime = isSuperAdmin || hasPermission([PERMISSIONS.OVERTIME_APPROVE]);

  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [logs, setLogs] = useState<OvertimeLog[]>([]);
  const [pendingRequests, setPendingRequests] = useState<OvertimeRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OvertimeFormState>({
    employeeId: activeEmployeeId || '',
    overtimeDate: '',
    startTime: '',
    endTime: '',
    breakMinutes: '0',
    reason: '',
    projectCode: '',
    overtimeType: 'Regular',
    compensationType: 'Cash',
    overtimeRate: '1.5',
    managerId: '',
    employeeNotes: '',
  });

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      employeeId: activeEmployeeId || current.employeeId,
    }));
  }, [activeEmployeeId]);

  const loadData = useCallback(async () => {
    if (!canViewOvertime) {
      setLoading(false);
      setRequests([]);
      setLogs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestPromise = activeEmployeeId
        ? hrApi.hrms.overtime.requests.byEmployee(activeEmployeeId)
        : hrApi.hrms.overtime.requests.list({ skip: 0, take: 50 });
      const logPromise = activeEmployeeId
        ? hrApi.hrms.overtime.logs.byEmployee(activeEmployeeId)
        : hrApi.hrms.overtime.logs.list({ skip: 0, take: 50 });
      const approvalPromise = canApproveOvertime
        ? hrApi.hrms.overtime.requests.pending()
        : Promise.resolve(null);

      const [requestsRes, logsRes, approvalsRes] = await Promise.all([
        requestPromise,
        logPromise,
        approvalPromise,
      ]);

      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);

      if (approvalsRes && Array.isArray(approvalsRes.data)) {
        setPendingRequests(approvalsRes.data);
      } else if (!canApproveOvertime) {
        setPendingRequests([]);
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load overtime data.');
      setError(message);
      notifyError(message, 'Overtime');
    } finally {
      setLoading(false);
    }
  }, [activeEmployeeId, canApproveOvertime, canViewOvertime]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const overtimeStats = useMemo(() => {
    const totalRequests = requests.length;
    const pendingCount = requests.filter((request) => (request.status || '').toLowerCase() === 'pendingapproval' || (request.status || '').toLowerCase() === 'submitted' || (request.status || '').toLowerCase() === 'pending').length;
    const approvedRequests = requests.filter((request) => (request.status || '').toLowerCase() === 'approved').length;
    const totalHours = logs.reduce((sum, log) => sum + (Number(log.overtimeHours) || 0), 0);

    return { totalRequests, pendingRequests: pendingCount, approvedRequests, totalHours };
  }, [logs, requests]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required to submit overtime.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await hrApi.hrms.overtime.requests.create({
        employeeId: formData.employeeId.trim(),
        overtimeDate: new Date(`${formData.overtimeDate}T00:00:00`).toISOString(),
        startTime: toTimeSpan(formData.startTime),
        endTime: toTimeSpan(formData.endTime),
        breakMinutes: Number(formData.breakMinutes) || 0,
        reason: formData.reason.trim(),
        projectCode: formData.projectCode.trim() || undefined,
        overtimeType: formData.overtimeType,
        managerId: formData.managerId.trim() || undefined,
        isPreApproved: false,
        compensationType: formData.compensationType,
        overtimeRate: Number(formData.overtimeRate) || 1.5,
        employeeNotes: formData.employeeNotes.trim() || undefined,
      });

      notifySuccess('Overtime request submitted.');
      setFormData({
        employeeId: activeEmployeeId || '',
        overtimeDate: '',
        startTime: '',
        endTime: '',
        breakMinutes: '0',
        reason: '',
        projectCode: '',
        overtimeType: 'Regular',
        compensationType: 'Cash',
        overtimeRate: '1.5',
        managerId: '',
        employeeNotes: '',
      });
      setShowForm(false);
      await loadData();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit overtime request.');
      setError(message);
      notifyError(message, 'Overtime Request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (requestId: string, status: 'Approved' | 'Rejected') => {
    const notes = status === 'Rejected' ? window.prompt('Enter rejection reason') || '' : window.prompt('Add optional approval notes') || '';

    try {
      setActionLoadingId(requestId);
      setError(null);

      await hrApi.hrms.overtime.approvals.create({
        overtimeRequestId: requestId,
        status,
        approvalNotes: status === 'Approved' ? notes || undefined : undefined,
        rejectionReason: status === 'Rejected' ? notes || undefined : undefined,
      });

      notifySuccess(`Overtime request ${status.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      const message = getApiErrorMessage(err, `Failed to ${status.toLowerCase()} overtime request.`);
      setError(message);
      notifyError(message, 'Overtime Approval');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!canViewOvertime) {
    return (
      <StandardPageLayout
        title="Overtime Tracking"
        subtitle="You do not have permission to view overtime records."
        eyebrow="HRMS / Time & Attendance"
        icon="attendance"
      >
        <div className="erp-empty">Overtime access is restricted for your role.</div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Overtime Tracking"
      subtitle="Submit overtime requests, review approvals, and inspect processed logs from a single HRMS workspace."
      eyebrow="HRMS / Time & Attendance"
      icon="attendance"
      actions={
        canCreateOvertime ? (
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="erp-action-btn erp-action-btn-primary"
          >
            {showForm ? 'Close Request Form' : 'Request Overtime'}
          </button>
        ) : null
      }
      filters={
        <div className="erp-form-grid erp-form-grid-2 items-end">
          <div>
            <label className="erp-label">Employee ID</label>
            <input
              className="erp-input"
              value={activeEmployeeId || ''}
              readOnly
              placeholder="Resolved from user context or query string"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            Showing overtime data for <span className="font-semibold text-slate-900">{activeEmployeeId || 'all accessible employees'}</span>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {loading ? <div className="erp-loading">Loading overtime records...</div> : null}

      {!loading ? (
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card erp-kpi-card-info">
            <p className="erp-kpi-label">Requests</p>
            <p className="erp-kpi-value">{overtimeStats.totalRequests}</p>
            <p className="erp-kpi-meta">Overtime requests loaded for the current scope.</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-warning">
            <p className="erp-kpi-label">Pending</p>
            <p className="erp-kpi-value">{overtimeStats.pendingRequests}</p>
            <p className="erp-kpi-meta">Submitted or pending approval requests.</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-success">
            <p className="erp-kpi-label">Approved</p>
            <p className="erp-kpi-value erp-kpi-value-success">{overtimeStats.approvedRequests}</p>
            <p className="erp-kpi-meta">Approved requests available for payroll processing.</p>
          </div>
          <div className="erp-kpi-card">
            <p className="erp-kpi-label">Logged hours</p>
            <p className="erp-kpi-value">{formatNumber(overtimeStats.totalHours)}</p>
            <p className="erp-kpi-meta">Loaded from overtime logs.</p>
          </div>
        </div>
      ) : null}

      {showForm && canCreateOvertime ? (
        <div className="erp-panel mt-6">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Request Overtime</h2>
              <p className="mt-1 text-sm text-slate-500">
                Capture the time window, reason, and compensation preferences using the existing overtime API.
              </p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Employee ID</label>
                  <input
                    className="erp-input"
                    value={formData.employeeId}
                    onChange={(event) => setFormData({ ...formData, employeeId: event.target.value })}
                    placeholder="Employee UUID"
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Overtime Date</label>
                  <input
                    type="date"
                    className="erp-input"
                    value={formData.overtimeDate}
                    onChange={(event) => setFormData({ ...formData, overtimeDate: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Start Time</label>
                  <input
                    type="time"
                    className="erp-input"
                    value={formData.startTime}
                    onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">End Time</label>
                  <input
                    type="time"
                    className="erp-input"
                    value={formData.endTime}
                    onChange={(event) => setFormData({ ...formData, endTime: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="erp-form-grid erp-form-grid-3">
                <div>
                  <label className="erp-label">Break Minutes</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="erp-input"
                    value={formData.breakMinutes}
                    onChange={(event) => setFormData({ ...formData, breakMinutes: event.target.value })}
                  />
                </div>
                <div>
                  <label className="erp-label">Overtime Type</label>
                  <select
                    className="erp-select"
                    value={formData.overtimeType}
                    onChange={(event) => setFormData({ ...formData, overtimeType: event.target.value })}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Compensation Type</label>
                  <select
                    className="erp-select"
                    value={formData.compensationType}
                    onChange={(event) => setFormData({ ...formData, compensationType: event.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="TimeOff">Time Off</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Overtime Rate</label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    className="erp-input"
                    value={formData.overtimeRate}
                    onChange={(event) => setFormData({ ...formData, overtimeRate: event.target.value })}
                  />
                </div>
                <div>
                  <label className="erp-label">Manager ID</label>
                  <input
                    className="erp-input"
                    value={formData.managerId}
                    onChange={(event) => setFormData({ ...formData, managerId: event.target.value })}
                    placeholder="Optional manager UUID"
                  />
                </div>
              </div>

              <div>
                <label className="erp-label">Project Code</label>
                <input
                  className="erp-input"
                  value={formData.projectCode}
                  onChange={(event) => setFormData({ ...formData, projectCode: event.target.value })}
                  placeholder="Optional project code"
                />
              </div>

              <div>
                <label className="erp-label">Reason</label>
                <textarea
                  className="erp-input"
                  rows={3}
                  value={formData.reason}
                  onChange={(event) => setFormData({ ...formData, reason: event.target.value })}
                  required
                />
              </div>

              <div>
                <label className="erp-label">Employee Notes</label>
                <textarea
                  className="erp-input"
                  rows={2}
                  value={formData.employeeNotes}
                  onChange={(event) => setFormData({ ...formData, employeeNotes: event.target.value })}
                />
              </div>

              <div className="erp-form-actions">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="erp-action-btn erp-action-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="erp-action-btn erp-action-btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="erp-section-grid erp-section-grid-two mt-6">
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Requests</h2>
              <p className="mt-1 text-sm text-slate-500">Existing overtime requests returned by the backend.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            {requests.length === 0 ? (
              <div className="erp-empty">No overtime requests found.</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Employee</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Hours</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{request.employeeName || request.employeeId}</div>
                          <div className="text-xs text-slate-500">{request.projectCode || request.overtimeType || 'Overtime request'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(request.overtimeDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatNumber(request.netOvertimeHours ?? request.totalHours)}</td>
                        <td className="px-4 py-3">
                          <span className="erp-chip erp-chip-info">{request.status || 'Pending'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Logs</h2>
              <p className="mt-1 text-sm text-slate-500">Processed overtime log entries for payroll follow-up.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            {logs.length === 0 ? (
              <div className="erp-empty">No overtime logs found.</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-900">{log.employeeName || log.employeeId}</div>
                        <div className="text-xs text-slate-500">{formatDate(log.overtimeDate)}</div>
                      </div>
                      <span className="erp-chip erp-chip-success">
                        {log.isProcessedInPayroll ? 'Processed' : 'Unprocessed'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <div>Hours: {formatNumber(log.overtimeHours)}</div>
                      <div>Amount: {formatNumber(log.overtimeAmount)}</div>
                      <div>Type: {log.overtimeType || '-'}</div>
                      <div>Compensation: {log.compensationType || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {canApproveOvertime ? (
        <div className="erp-panel mt-6">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Pending Approvals</h2>
              <p className="mt-1 text-sm text-slate-500">Approve or reject requests that are currently awaiting action.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            {pendingRequests.length === 0 ? (
              <div className="erp-empty">No pending overtime approvals.</div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{request.employeeName || request.employeeId}</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(request.overtimeDate)} {request.overtimeType ? `- ${request.overtimeType}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoadingId === request.id}
                        onClick={() => void handleApproval(request.id, 'Approved')}
                        className="erp-action-btn erp-action-btn-primary text-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === request.id}
                        onClick={() => void handleApproval(request.id, 'Rejected')}
                        className="erp-action-btn erp-action-btn-danger text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </StandardPageLayout>
  );
}
