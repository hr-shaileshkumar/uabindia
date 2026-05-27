'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useOvertime } from '@/lib/api-hooks-part2';

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
      console.error('Failed to load data:', err);
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
      console.error('Failed to create request:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Overtime Tracking</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Request Overtime
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <label className="block text-sm font-medium mb-2">Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {showForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Request Overtime</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Overtime Date</label>
                <input
                  type="date"
                  value={formData.overtimeDate}
                  onChange={(e) => setFormData({ ...formData, overtimeDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Overtime Hours</label>
                <input
                  type="number"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) })}
                  step="0.5"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project Name (Optional)</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Requesting...' : 'Request'}
            </button>
          </form>
        </div>
      )}

      {report && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Monthly Report - {selectedMonth}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold">{(report as any).totalOvertimeHours}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold">{(report as any).totalRequests}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">{(report as any).approvedRequests}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{(report as any).pendingRequests}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
