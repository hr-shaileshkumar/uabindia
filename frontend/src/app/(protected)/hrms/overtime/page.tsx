'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useOvertime } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

const formatMonthLabel = (value: string) => {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export default function OvertimePage() {
  const {
    createOvertimeRequest,
    getOvertimeReport,
    loading,
    error,
  } = useOvertime();

  const [report, setReport] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    overtimeDate: '',
    overtimeHours: 0,
    startTime: '',
    endTime: '',
    reason: '',
    projectName: '',
  });

  const loadData = useCallback(async () => {
    try {
      const reportData = await getOvertimeReport(selectedMonth);
      setReport(reportData || null);
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load overtime data.'), 'Overtime');
    }
  }, [getOvertimeReport, selectedMonth]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOvertimeRequest(formData);
      setFormData({
        overtimeDate: '',
        overtimeHours: 0,
        startTime: '',
        endTime: '',
        reason: '',
        projectName: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to submit overtime request.'), 'Overtime Request');
    }
  };

  const summary = report as any | null;

  return (
    <StandardPageLayout
      title="Overtime Tracking"
      subtitle="Monitor monthly overtime demand, approval flow, and employee requests in a single HRMS operations workspace."
      eyebrow="HRMS / Time & Attendance"
      icon="attendance"
      actions={
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="erp-action-btn erp-action-btn-primary"
        >
          {showForm ? 'Close Request Form' : 'Request Overtime'}
        </button>
      }
      filters={
        <div className="erp-form-grid erp-form-grid-2 items-end">
          <div>
            <label className="erp-label">Reporting month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="erp-input"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            Monthly summary for <span className="font-semibold text-slate-900">{formatMonthLabel(selectedMonth)}</span>
          </div>
        </div>
      }
    >

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {loading && !summary ? <div className="erp-loading">Loading overtime summary...</div> : null}

      {summary ? (
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card erp-kpi-card-info">
            <p className="erp-kpi-label">Total overtime hours</p>
            <p className="erp-kpi-value">{summary.totalOvertimeHours ?? 0}</p>
            <p className="erp-kpi-meta">Tracked for {formatMonthLabel(selectedMonth)}.</p>
          </div>
          <div className="erp-kpi-card">
            <p className="erp-kpi-label">Requests raised</p>
            <p className="erp-kpi-value">{summary.totalRequests ?? 0}</p>
            <p className="erp-kpi-meta">All overtime submissions logged this cycle.</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-success">
            <p className="erp-kpi-label">Approved</p>
            <p className="erp-kpi-value erp-kpi-value-success">{summary.approvedRequests ?? 0}</p>
            <p className="erp-kpi-meta">Approved and ready for payroll/time posting.</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-warning">
            <p className="erp-kpi-label">Pending</p>
            <p className="erp-kpi-value">{summary.pendingRequests ?? 0}</p>
            <p className="erp-kpi-meta">Requests waiting on manager or HR action.</p>
          </div>
        </div>
      ) : null}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Request Overtime</h2>
              <p className="mt-1 text-sm text-slate-500">Capture overtime dates, effort, and business justification using the shared HRMS workflow.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Overtime Date</label>
                <input
                  type="date"
                  value={formData.overtimeDate}
                  onChange={(e) => setFormData({ ...formData, overtimeDate: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Overtime Hours</label>
                <input
                  type="number"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) })}
                  step="0.5"
                  min="0"
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div>
              <label className="erp-label">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                rows={3}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Project Name (Optional)</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="erp-input"
              />
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="erp-action-btn erp-action-btn-primary"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {!loading && !summary ? (
        <div className="erp-panel erp-panel-body text-sm text-slate-600">
          No overtime summary is available for the selected month yet.
        </div>
      ) : null}
    </StandardPageLayout>
  );
}
