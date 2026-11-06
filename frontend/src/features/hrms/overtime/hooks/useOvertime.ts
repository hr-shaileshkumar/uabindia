"use client";

import { useState, useCallback } from "react";
import apiClient from "@/services/apiClient";

export const useOvertime = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOvertimeRequest = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/overtime/requests", data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create request";
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
      if (employeeId) params.append("employeeId", employeeId);
      if (status) params.append("status", status);
      if (month) params.append("month", month);
      const url = params.toString() ? `/overtime/requests?${params}` : "/overtime/requests";
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch requests";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOvertimeRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: "Pending",
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit request";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveOvertimeRequest = useCallback(async (requestId: string, comments?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: "Approved",
        approvalNotes: comments,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve request";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOvertimeRequest = useCallback(async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: "Rejected",
        rejectionReason: reason,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject request";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processCompensation = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/logs`, { month });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process compensation";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOvertimeReport = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/overtime/logs?month=${encodeURIComponent(month)}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch report";
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
