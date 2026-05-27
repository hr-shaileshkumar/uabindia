'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePerformanceAppraisals } from '@/lib/api-hooks-part1';

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
      console.error('Failed to load data:', err);
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
      console.error('Failed to create appraisal:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Appraisals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Appraisal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Appraisal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Appraisal Period</label>
              <select
                value={formData.appraisalCycleId}
                onChange={(e) => setFormData({ ...formData, appraisalCycleId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium mb-2">Manager ID</label>
              <input
                type="text"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {appraisals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appraisals found. Create one to get started.
          </div>
        ) : (
          appraisals.map((appraisal: any) => (
            <div
              key={appraisal.id}
              className="p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Employee: {appraisal.employeeId}</h3>
                  <p className="text-sm text-gray-600">Manager: {appraisal.managerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appraisal.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  appraisal.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                  appraisal.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appraisal.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Overall Rating:</span>
                  <p className="font-semibold">{appraisal.overallRating}/5</p>
                </div>
                <div>
                  <span className="text-gray-600">Appraisal Date:</span>
                  <p className="font-semibold">{new Date(appraisal.appraisalDate).toLocaleDateString()}</p>
                </div>
              </div>
              {appraisal.managerComments && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Manager Comments:</p>
                  <p className="text-sm">{appraisal.managerComments}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
