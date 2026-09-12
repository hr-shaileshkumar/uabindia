'use client';

import { useState, useCallback } from 'react';
import apiClient from '@/services/apiClient';

export interface ShiftPayload {
  id?: string;
  shiftCode?: string;
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  breakDuration?: number;
  gracePeriodMinutes?: number;
  isNightShift?: boolean;
  nightShiftAllowance?: number;
  isActive?: boolean;
  shiftType?: string;
  minEmployeesRequired?: number;
  maxEmployeesAllowed?: number;
  departmentId?: string;
  [key: string]: any;
}

export interface ShiftSwapPayload {
  swapId?: string;
  employeeId?: string;
  targetEmployeeId?: string;
  shiftDate?: string;
  reason?: string;
  [key: string]: any;
}

export const useShifts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getShifts = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status.toLowerCase() === 'active'
        ? '/shifts/shifts/active'
        : '/shifts/shifts';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createShift = useCallback(async (data: ShiftPayload) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/shifts', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShift = useCallback(async (id: string, data: Partial<ShiftPayload>) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/shifts/shifts/${id}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.delete(`/shifts/shifts/${id}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignShift = useCallback(async (employeeId: string, shiftId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/assignments', {
        employeeId,
        shiftId,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoster = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/shifts/assignments');
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roster';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishRoster = useCallback(async () => {
    setLoading(true);
    try {
      throw new Error('Roster publishing is not supported by the backend yet');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish roster';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestShiftSwap = useCallback(async (data: ShiftSwapPayload) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/swaps', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request swap';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveShiftSwap = useCallback(async (swapId: string, approved: boolean, notes?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/shifts/swaps/${swapId}`, {
        approved,
        notes,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve swap';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getShifts,
    createShift,
    updateShift,
    deleteShift,
    assignShift,
    getRoster,
    publishRoster,
    requestShiftSwap,
    approveShiftSwap,
  };
};

export default useShifts;
