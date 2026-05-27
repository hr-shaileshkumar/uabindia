'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// Asset Management Hooks
export const useAssets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssets = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      if (category) {
        const response = await apiClient.get(`/api/v1/assets/assets/category/${encodeURIComponent(category)}`);
        setError(null);
        return response.data;
      }

      const url = '/api/v1/assets/assets';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAsset = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/assets/assets', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAsset = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/v1/assets/assets/${id}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllocations = useCallback(async (employeeId?: string, assetId?: string) => {
    setLoading(true);
    try {
      if (assetId) {
        const response = await apiClient.get(`/api/v1/assets/allocations/asset/${assetId}`);
        setError(null);
        return response.data;
      }

      if (employeeId) {
        const response = await apiClient.get(`/api/v1/assets/allocations/employee/${employeeId}`);
        setError(null);
        return response.data;
      }

      throw new Error('assetId or employeeId is required to fetch allocations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch allocations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const allocateAsset = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/assets/allocations', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to allocate asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const returnAsset = useCallback(async (allocationId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/v1/assets/allocations/${allocationId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to return asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleMaintenance = useCallback(async (assetId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/assets/maintenance', { assetId, ...data });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule maintenance';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepreciation = useCallback(async (assetId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/assets/maintenance/asset/${assetId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch depreciation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAssets,
    createAsset,
    updateAsset,
    getAllocations,
    allocateAsset,
    returnAsset,
    scheduleMaintenance,
    getDepreciation,
  };
};

// Shift Management Hooks
export const useShifts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getShifts = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status.toLowerCase() === 'active'
        ? '/api/v1/shifts/shifts/active'
        : '/api/v1/shifts/shifts';
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

  const createShift = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/shifts/shifts', data);
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

  const assignShift = useCallback(async (employeeId: string, shiftId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/shifts/assignments', { 
        employeeId, 
        shiftId 
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
      const response = await apiClient.get('/api/v1/shifts/assignments');
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

  const requestShiftSwap = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/shifts/swaps', data);
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
      const response = await apiClient.put(`/api/v1/shifts/swaps/${swapId}`, { 
        approved, 
        notes 
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
    assignShift,
    getRoster,
    publishRoster,
    requestShiftSwap,
    approveShiftSwap,
  };
};

// Overtime Tracking Hooks
export const useOvertime = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOvertimeRequest = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/overtime/requests', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOvertimeRequests = useCallback(async (employeeId?: string, status?: string, month?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);
      if (status) params.append('status', status);
      if (month) params.append('month', month);
      const url = params.toString() ? `/api/v1/overtime/requests?${params}` : '/api/v1/overtime/requests';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOvertimeRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Pending'
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveOvertimeRequest = useCallback(async (requestId: string, comments?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Approved',
        approvalNotes: comments
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOvertimeRequest = useCallback(async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Rejected',
        rejectionReason: reason
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processCompensation = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/overtime/logs`, { month });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process compensation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOvertimeReport = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/overtime/logs?month=${encodeURIComponent(month)}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOvertimeRequest,
    getOvertimeRequests,
    submitOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    processCompensation,
    getOvertimeReport,
  };
};
