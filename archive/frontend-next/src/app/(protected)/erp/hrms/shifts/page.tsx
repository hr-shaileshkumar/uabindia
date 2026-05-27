'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useShifts } from '@/lib/api-hooks-part2';

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
      console.error('Failed to load data:', err);
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
      console.error('Failed to create shift:', err);
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
      console.error('Failed to assign shift:', err);
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
      console.error('Failed to request swap:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shift Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowShiftForm(!showShiftForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Shift
          </button>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Assign Shift
          </button>
          <button
            onClick={() => setShowSwapForm(!showSwapForm)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Request Swap
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showShiftForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Shift</h2>
          <form onSubmit={handleShiftSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Shift Name</label>
                <input
                  type="text"
                  value={shiftForm.shiftName}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Shift Code</label>
                <input
                  type="text"
                  value={shiftForm.shiftCode}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Break (minutes)</label>
                <input
                  type="number"
                  value={shiftForm.breakDuration}
                  onChange={(e) => setShiftForm({ ...shiftForm, breakDuration: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Shift'}
            </button>
          </form>
        </div>
      )}

      {showAssignForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Assign Shift</h2>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee ID</label>
                <input
                  type="text"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Shift ID</label>
                <input
                  type="text"
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Assigning...' : 'Assign Shift'}
            </button>
          </form>
        </div>
      )}

      {showSwapForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Request Shift Swap</h2>
          <form onSubmit={handleSwapSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Swap With</label>
                <input
                  type="text"
                  value={swapForm.requestedWith}
                  onChange={(e) => setSwapForm({ ...swapForm, requestedWith: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Original Date</label>
                <input
                  type="date"
                  value={swapForm.originalShiftDate}
                  onChange={(e) => setSwapForm({ ...swapForm, originalShiftDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Swap Date</label>
                <input
                  type="date"
                  value={swapForm.swappedShiftDate}
                  onChange={(e) => setSwapForm({ ...swapForm, swappedShiftDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <input
                  type="text"
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Request Swap'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h2 className="text-xl font-semibold mb-4">Shifts</h2>
        {shifts.length === 0 ? (
          <div className="text-sm text-gray-500">No shifts found.</div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift: any) => (
              <div key={shift.id} className="p-3 border rounded-lg">
                <div className="font-medium">{shift.shiftName}</div>
                <div className="text-xs text-gray-500">{shift.startTime} - {shift.endTime}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
