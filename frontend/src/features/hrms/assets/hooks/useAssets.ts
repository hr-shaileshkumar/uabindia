'use client';

import { useState, useCallback } from 'react';
import apiClient from '@/services/apiClient';

export interface AssetPayload {
  id?: string;
  name?: string;
  assetName?: string;
  assetCode?: string;
  category?: string;
  assetCategory?: string;
  status?: string;
  serialNumber?: string;
  location?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currentValue?: number;
  usefulLifeYears?: number;
  supplier?: string;
  warrantyInfo?: string;
  warrantyExpiryDate?: string;
  isUnderWarranty?: boolean;
  allocatedToEmployeeId?: string | null;
  allocationDate?: string | null;
  notes?: string;
  [key: string]: any;
}

export interface AllocationPayload {
  id?: string;
  assetId?: string;
  employeeId?: string;
  allocationDate?: string;
  notes?: string;
  [key: string]: any;
}

export const useAssets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssets = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      if (category && category !== 'ALL') {
        const response = await apiClient.get(`/assets/assets/category/${encodeURIComponent(category)}`);
        setError(null);
        return response.data;
      }

      const url = '/assets/assets';
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

  const createAsset = useCallback(async (data: AssetPayload) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assets/assets', data);
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

  const updateAsset = useCallback(async (id: string, data: Partial<AssetPayload>) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/assets/assets/${id}`, data);
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

  const deleteAsset = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.delete(`/assets/assets/${id}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete asset';
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
        const response = await apiClient.get(`/assets/allocations/asset/${assetId}`);
        setError(null);
        return response.data;
      }

      if (employeeId) {
        const response = await apiClient.get(`/assets/allocations/employee/${employeeId}`);
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

  const allocateAsset = useCallback(async (data: AllocationPayload) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assets/allocations', data);
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
      const response = await apiClient.put(`/assets/allocations/${allocationId}`, data);
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
      const response = await apiClient.post('/assets/maintenance', { assetId, ...data });
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
      const response = await apiClient.get(`/assets/maintenance/asset/${assetId}`);
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
    deleteAsset,
    getAllocations,
    allocateAsset,
    returnAsset,
    scheduleMaintenance,
    getDepreciation,
  };
};

export default useAssets;
