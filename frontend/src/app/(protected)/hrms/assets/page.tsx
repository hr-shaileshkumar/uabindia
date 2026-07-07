'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useAssets } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function AssetsPage() {
  const {
    getAssets,
    createAsset,
    getAllocations,
    allocateAsset,
    loading,
    error,
  } = useAssets();

  const [assets, setAssets] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
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
      const assetsData = await getAssets();
      const assetList = Array.isArray(assetsData) ? assetsData : [];
      const allocationGroups = await Promise.all(
        assetList
          .map((asset: any) => asset?.id ?? asset?.assetId)
          .filter((assetId: unknown): assetId is string => typeof assetId === 'string' && assetId.length > 0)
          .map((assetId) => getAllocations(undefined, assetId))
      );
      const allocationsData = allocationGroups.flatMap((group: any) => (Array.isArray(group) ? group : []));
      setAssets(assetList);
      setAllocations(allocationsData || []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load assets.'), 'Assets');
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
      notifyError(getApiErrorMessage(err, 'Failed to create asset.'), 'New Asset');
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
      notifyError(getApiErrorMessage(err, 'Failed to allocate asset.'), 'Asset Allocation');
    }
  };

  const averageAssetValue = assets.length
    ? assets.reduce((sum: number, item: any) => sum + Number(item.purchaseValue || 0), 0) / assets.length
    : 0;
  const categoryCount = new Set(assets.map((item: any) => item.assetCategory).filter(Boolean)).size;

  return (
    <StandardPageLayout
      title="Asset Management"
      subtitle="Control asset masters, employee allocations, and lifecycle transactions through one coordinated HRMS operations view."
      eyebrow="HRMS / Asset Control"
      icon="box"
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAssetForm(!showAssetForm)}
            className="erp-action-btn erp-action-btn-primary"
          >
            {showAssetForm ? 'Close Asset Form' : 'New Asset'}
          </button>
          <button
            type="button"
            onClick={() => setShowAllocationForm(!showAllocationForm)}
            className="erp-action-btn erp-action-btn-secondary"
          >
            {showAllocationForm ? 'Close Allocation Form' : 'Allocate Asset'}
          </button>
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Assets</p>
          <p className="erp-kpi-value">{assets.length}</p>
          <p className="erp-kpi-meta">Master asset records currently active in the catalog.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Allocations</p>
          <p className="erp-kpi-value">{allocations.length}</p>
          <p className="erp-kpi-meta">Employee-linked allocation transactions recorded in the system.</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Asset categories</p>
          <p className="erp-kpi-value">{categoryCount}</p>
          <p className="erp-kpi-meta">Distinct asset groups represented in the current asset base.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Average value</p>
          <p className="erp-kpi-value erp-kpi-value-success">{formatCurrency(averageAssetValue)}</p>
          <p className="erp-kpi-meta">Average purchase value across active assets.</p>
        </div>
      </div>

      {error ? <div className="erp-alert-error">Error: {error}</div> : null}

      <div className="erp-section-grid">
      {showAssetForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create New Asset</h2>
              <p className="mt-1 text-sm text-slate-500">Maintain asset codes, category, acquisition data, and financial attributes.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleAssetSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Asset Code</label>
                <input
                  type="text"
                  value={assetForm.assetCode}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Asset Name</label>
                <input
                  type="text"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Category</label>
                <select
                  value={assetForm.assetCategory}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCategory: e.target.value })}
                  className="erp-select"
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
                <label className="erp-label">Asset Type</label>
                <input
                  type="text"
                  value={assetForm.assetType}
                  onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Purchase Date</label>
                <input
                  type="date"
                  value={assetForm.purchaseDate}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Purchase Value (₹)</label>
                <input
                  type="number"
                  value={assetForm.purchaseValue}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseValue: parseInt(e.target.value) })}
                  min="0"
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowAssetForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {showAllocationForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Allocate Asset</h2>
              <p className="mt-1 text-sm text-slate-500">Assign assets to employees while preserving the same asset-control interaction standard.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleAllocationSubmit} className="space-y-4">
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Asset ID</label>
                <input
                  type="text"
                  value={allocationForm.assetId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, assetId: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Employee ID</label>
                <input
                  type="text"
                  value={allocationForm.employeeId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>
            <div>
              <label className="erp-label">Reason</label>
              <textarea
                value={allocationForm.allocationReason}
                onChange={(e) => setAllocationForm({ ...allocationForm, allocationReason: e.target.value })}
                required
                rows={3}
                className="erp-input"
              />
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowAllocationForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="erp-action-btn erp-action-btn-primary">
                {loading ? 'Allocating...' : 'Allocate Asset'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
      </div>

      <div className="erp-section-grid erp-section-grid-two">
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Assets</h2>
              <p className="mt-1 text-sm text-slate-500">Asset master records with classification and acquisition visibility.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          {assets.length === 0 ? (
            <div className="erp-empty">No assets found.</div>
          ) : (
            <div className="erp-record-grid">
              {assets.map((asset: any) => (
                <div key={asset.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{asset.assetName}</div>
                      <div className="erp-record-meta">{asset.assetCode} • {asset.assetCategory}</div>
                    </div>
                    <span className="erp-chip erp-chip-info">{asset.assetCategory || 'Asset'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Allocations</h2>
              <p className="mt-1 text-sm text-slate-500">Employee allocation movements and current assignee visibility.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          {allocations.length === 0 ? (
            <div className="erp-empty">No allocations found.</div>
          ) : (
            <div className="erp-record-grid">
              {allocations.map((allocation: any) => (
                <div key={allocation.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{allocation.assetName}</div>
                      <div className="erp-record-meta">{allocation.employeeName || allocation.employeeId}</div>
                    </div>
                    <span className="erp-chip erp-chip-success">Allocated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
