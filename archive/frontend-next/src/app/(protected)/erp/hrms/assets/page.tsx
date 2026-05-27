'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAssets } from '@/lib/api-hooks-part2';

export default function AssetsPage() {
  const {
    getAssets,
    createAsset,
    getAllocations,
    allocateAsset,
    loading,
    error,
  } = useAssets();

  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetCode: '',
    assetName: '',
    assetCategory: 'Laptop',
    assetType: '',
    purchaseDate: '',
    purchaseValue: 0,
    depreciation: 0,
  });
  const [allocationForm, setAllocationForm] = useState({
    assetId: '',
    employeeId: '',
    allocationReason: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [assetsData, allocationsData] = await Promise.all([
        getAssets('Active'),
        getAllocations(),
      ]);
      setAssets(assetsData || []);
      setAllocations(allocationsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [getAssets, getAllocations]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset(assetForm);
      setAssetForm({
        assetCode: '',
        assetName: '',
        assetCategory: 'Laptop',
        assetType: '',
        purchaseDate: '',
        purchaseValue: 0,
        depreciation: 0,
      });
      setShowAssetForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to create asset:', err);
    }
  };

  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await allocateAsset(allocationForm);
      setAllocationForm({
        assetId: '',
        employeeId: '',
        allocationReason: '',
      });
      setShowAllocationForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to allocate asset:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowAssetForm(!showAssetForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Asset
          </button>
          <button
            onClick={() => setShowAllocationForm(!showAllocationForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Allocate Asset
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showAssetForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Asset</h2>
          <form onSubmit={handleAssetSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Asset Code</label>
                <input
                  type="text"
                  value={assetForm.assetCode}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Asset Name</label>
                <input
                  type="text"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={assetForm.assetCategory}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Laptop</option>
                  <option>Desktop</option>
                  <option>Mobile</option>
                  <option>Furniture</option>
                  <option>Equipment</option>
                  <option>Vehicle</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Asset Type</label>
                <input
                  type="text"
                  value={assetForm.assetType}
                  onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={assetForm.purchaseDate}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Purchase Value (₹)</label>
                <input
                  type="number"
                  value={assetForm.purchaseValue}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseValue: parseInt(e.target.value) })}
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
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </form>
        </div>
      )}

      {showAllocationForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Allocate Asset</h2>
          <form onSubmit={handleAllocationSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Asset ID</label>
                <input
                  type="text"
                  value={allocationForm.assetId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, assetId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Employee ID</label>
                <input
                  type="text"
                  value={allocationForm.employeeId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <textarea
                value={allocationForm.allocationReason}
                onChange={(e) => setAllocationForm({ ...allocationForm, allocationReason: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Allocating...' : 'Allocate Asset'}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Assets</h2>
          {assets.length === 0 ? (
            <div className="text-sm text-gray-500">No assets found.</div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset: any) => (
                <div key={asset.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{asset.assetName}</div>
                  <div className="text-xs text-gray-500">{asset.assetCode} • {asset.assetCategory}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Allocations</h2>
          {allocations.length === 0 ? (
            <div className="text-sm text-gray-500">No allocations found.</div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation: any) => (
                <div key={allocation.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{allocation.assetName}</div>
                  <div className="text-xs text-gray-500">{allocation.employeeName || allocation.employeeId}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
