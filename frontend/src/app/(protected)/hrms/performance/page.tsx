'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { usePerformanceAppraisals } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

const getStatusChipClass = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'erp-chip erp-chip-success';
    case 'Submitted':
      return 'erp-chip erp-chip-info';
    case 'Rejected':
      return 'erp-chip erp-chip-danger';
    default:
      return 'erp-chip erp-chip-neutral';
  }
};

export default function PerformanceAppraisalPage() {
  const { 
    getAppraisals, 
    createAppraisal, 
    getAppraisalPeriods,
    loading, 
    error 
  } = usePerformanceAppraisals();

  const [appraisals, setAppraisals] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    appraisalCycleId: '',
    managerId: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [appraisalsData, periodsData] = await Promise.all([
        getAppraisals(),
        getAppraisalPeriods(),
      ]);
      setAppraisals(appraisalsData || []);
      setPeriods(periodsData || []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load appraisals.'), 'Performance');
    }
  }, [getAppraisals, getAppraisalPeriods]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAppraisal(formData);
      setFormData({ employeeId: '', appraisalCycleId: '', managerId: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to create appraisal.'), 'New Appraisal');
    }
  };

  const approvedCount = appraisals.filter((item: any) => item.status === 'Approved').length;
  const averageRating = appraisals.length
    ? (
        appraisals.reduce((sum: number, item: any) => sum + Number(item.overallRating || 0), 0) / appraisals.length
      ).toFixed(1)
    : '0.0';

  return (
    <StandardPageLayout
      title="Performance Appraisals"
      subtitle="Create and monitor appraisal cycles, review status, and manager commentary through a unified performance workspace."
      eyebrow="HRMS / Performance Management"
      icon="file"
      actions={
        <button type="button" onClick={() => setShowForm((prev) => !prev)} className="erp-action-btn erp-action-btn-primary">
          {showForm ? 'Close Appraisal Form' : 'New Appraisal'}
        </button>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Appraisals</p>
          <p className="erp-kpi-value">{appraisals.length}</p>
          <p className="erp-kpi-meta">Performance review records currently loaded in the workspace.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Appraisal periods</p>
          <p className="erp-kpi-value">{periods.length}</p>
          <p className="erp-kpi-meta">Available review cycles and configured appraisal windows.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Approved</p>
          <p className="erp-kpi-value erp-kpi-value-success">{approvedCount}</p>
          <p className="erp-kpi-meta">Finalized appraisals with completed approval routing.</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Average rating</p>
          <p className="erp-kpi-value">{averageRating}</p>
          <p className="erp-kpi-meta">Average overall score across all loaded appraisal records.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create New Appraisal</h2>
              <p className="mt-1 text-sm text-slate-500">Start an appraisal with employee, cycle, and manager ownership details.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="erp-label">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Appraisal Period</label>
              <select
                value={formData.appraisalCycleId}
                onChange={(e) => setFormData({ ...formData, appraisalCycleId: e.target.value })}
                required
                className="erp-select"
              >
                <option value="">Select a period</option>
                {periods.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="erp-label">Manager ID</label>
              <input
                type="text"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                required
                className="erp-input"
              />
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Creating...' : 'Create Appraisal'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      <div className="erp-record-grid">
        {appraisals.length === 0 ? (
          <div className="erp-empty">
            No appraisals found. Create one to get started.
          </div>
        ) : (
          appraisals.map((appraisal: any) => (
            <div key={appraisal.id} className="erp-record-card">
              <div className="erp-record-header">
                <div>
                  <div className="erp-record-title">Employee: {appraisal.employeeId}</div>
                  <div className="erp-record-meta">Manager: {appraisal.managerName || appraisal.managerId || 'Manager pending'}</div>
                </div>
                <span className={getStatusChipClass(appraisal.status)}>{appraisal.status || 'Draft'}</span>
              </div>
              <div className="erp-record-body">
                <div className="erp-form-grid erp-form-grid-2 text-sm">
                  <div>
                    <div className="erp-metric-label">Overall Rating</div>
                    <div className="erp-metric-value">{appraisal.overallRating}/5</div>
                  </div>
                  <div>
                    <div className="erp-metric-label">Appraisal Date</div>
                    <div className="erp-metric-value">{new Date(appraisal.appraisalDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              {appraisal.managerComments && (
                <div className="mt-4">
                  <p className="erp-metric-label">Manager Comments</p>
                  <p className="text-sm text-slate-700">{appraisal.managerComments}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </StandardPageLayout>
  );
}
