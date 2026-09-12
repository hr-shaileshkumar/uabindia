"use client";

import { useState, useCallback } from "react";
import apiClient from "@/services/apiClient";

export const usePerformanceAppraisals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAppraisals = useCallback(async (employeeId?: string) => {
    setLoading(true);
    try {
      const url = employeeId
        ? `/appraisals?page=1&limit=20`
        : "/appraisals?page=1&limit=20";
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.appraisals ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch appraisals";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppraisal = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/appraisals", data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create appraisal";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppraisal = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/appraisals/${id}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update appraisal";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAppraisal = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/appraisals/${id}/self-assess`, {});
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit appraisal";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAppraisal = useCallback(async (id: string, comments?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/appraisals/${id}/approve`, { comments });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve appraisal";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppraisalPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/appraisals/cycles");
      setError(null);
      return response.data?.cycles ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch periods";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (appraisalId: string, goalData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/appraisals/competencies`, goalData);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add goal";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAppraisals,
    createAppraisal,
    updateAppraisal,
    submitAppraisal,
    approveAppraisal,
    getAppraisalPeriods,
    addGoal,
  };
};
