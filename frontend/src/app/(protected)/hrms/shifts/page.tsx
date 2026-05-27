'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useShifts } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function ShiftsPage() {
  const {
    getShifts,
    createShift,
    assignShift,
    requestShiftSwap,
    loading,
    error,
  } = useShifts();

  const [shifts, setShifts] = useState([]);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    shiftName: '',
    shiftCode: '',
    startTime: '',
    endTime: '',
    breakDuration: 0,
    totalWorkingHours: 8,
  });
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
  });
  const [swapForm, setSwapForm] = useState({
    requestedWith: '',
    originalShiftDate: '',
    swappedShiftDate: '',
    reason: '',
  });

  const loadData = useCallback(async () => {
    try {
      const shiftsData = await getShifts('Active');
      setShifts(shiftsData || []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load shifts.'), 'Shifts');
    }
  }, [getShifts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift(shiftForm);
      setShiftForm({
        shiftName: '',
        shiftCode: '',
        startTime: '',
        endTime: '',
        breakDuration: 0,
        totalWorkingHours: 8,
      });
      setShowShiftForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to create shift.'), 'New Shift');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignShift(assignForm.employeeId, assignForm.shiftId);
      setAssignForm({ employeeId: '', shiftId: '' });
      setShowAssignForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to assign shift.'), 'Assign Shift');
    }
  };

  const handleSwapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestShiftSwap(swapForm);
      setSwapForm({
        requestedWith: '',
        originalShiftDate: '',
        swappedShiftDate: '',
        reason: '',
      });
      setShowSwapForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to submit swap request.'), 'Shift Swap');
    }
  };

  const openWorkbenches = [showShiftForm, showAssignForm, showSwapForm].filter(Boolean).length;

  return (
    <StandardPageLayout
      title="Shift Management"
      subtitle="Administer shift masters, employee assignments, and swap requests from a single workforce scheduling workbench."
      eyebrow="HRMS / Scheduling"
      icon="attendance"
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowShiftForm(!showShiftForm)}
            className="erp-action-btn erp-action-btn-primary"
          >
            {showShiftForm ? 'Close Shift Form' : 'New Shift'}
          </button>
          <button
            type="button"
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="erp-action-btn erp-action-btn-secondary"
          >
            {showAssignForm ? 'Close Assign Form' : 'Assign Shift'}
          </button>
          <button
            type="button"
            onClick={() => setShowSwapForm(!showSwapForm)}
            className="erp-action-btn erp-action-btn-secondary"
          >
            {showSwapForm ? 'Close Swap Form' : 'Request Swap'}
          </button>
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Active shifts</p>
          <p className="erp-kpi-value">{shifts.length}</p>
          <p className="erp-kpi-meta">Configured shift templates available for assignment.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Open workbenches</p>
          <p className="erp-kpi-value">{openWorkbenches}</p>
          <p className="erp-kpi-meta">Scheduling forms currently expanded in the workspace.</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Available workflows</p>
          <p className="erp-kpi-value">3</p>
          <p className="erp-kpi-meta">Master creation, shift assignment, and swap request handling.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Data state</p>
          <p className="erp-kpi-value erp-kpi-value-success">{loading ? 'Syncing' : 'Ready'}</p>
          <p className="erp-kpi-meta">Current scheduling board availability for transaction entry.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      <div className="erp-section-grid">
      {showShiftForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create New Shift</h2>
              <p className="mt-1 text-sm text-slate-500">Maintain shift timing, code structure, and working-hour configuration.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleShiftSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Shift Name</label>
                <input
                  type="text"
                  value={shiftForm.shiftName}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Shift Code</label>
                <input
                  type="text"
                  value={shiftForm.shiftCode}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-3">
              <div>
                <label className="erp-label">Start Time</label>
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">End Time</label>
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Break (minutes)</label>
                <input
                  type="number"
                  value={shiftForm.breakDuration}
                  onChange={(e) => setShiftForm({ ...shiftForm, breakDuration: parseInt(e.target.value) })}
                  min="0"
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowShiftForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Creating...' : 'Create Shift'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {showAssignForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Assign Shift</h2>
              <p className="mt-1 text-sm text-slate-500">Link employees to active shift masters without leaving the scheduling workbench.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Employee ID</label>
                <input
                  type="text"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Shift ID</label>
                <input
                  type="text"
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowAssignForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Assigning...' : 'Assign Shift'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {showSwapForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Request Shift Swap</h2>
              <p className="mt-1 text-sm text-slate-500">Log swap counterpart, date movement, and business reason using the standardized scheduling form.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleSwapSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Swap With</label>
                <input
                  type="text"
                  value={swapForm.requestedWith}
                  onChange={(e) => setSwapForm({ ...swapForm, requestedWith: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Original Date</label>
                <input
                  type="date"
                  value={swapForm.originalShiftDate}
                  onChange={(e) => setSwapForm({ ...swapForm, originalShiftDate: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Swap Date</label>
                <input
                  type="date"
                  value={swapForm.swappedShiftDate}
                  onChange={(e) => setSwapForm({ ...swapForm, swappedShiftDate: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Reason</label>
                <input
                  type="text"
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowSwapForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Submitting...' : 'Request Swap'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
      </div>

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Shift Catalog</h2>
            <p className="mt-1 text-sm text-slate-500">Review configured shifts and their active time windows.</p>
          </div>
        </div>
        <div className="erp-panel-body">
        {shifts.length === 0 ? (
          <div className="erp-empty">No shifts found.</div>
        ) : (
          <div className="erp-record-grid erp-record-grid-three">
            {shifts.map((shift: any) => (
              <div key={shift.id} className="erp-record-card">
                <div className="erp-record-header">
                  <div>
                    <div className="erp-record-title">{shift.shiftName}</div>
                    <div className="erp-record-meta">{shift.shiftCode || 'Shift code'} • {shift.startTime} - {shift.endTime}</div>
                  </div>
                  <span className="erp-chip erp-chip-success">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </StandardPageLayout>
  );
}
