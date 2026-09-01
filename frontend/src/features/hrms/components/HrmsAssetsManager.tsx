"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/workspace/styles";
import { useAssets } from "@/hooks/useHrmsApi";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export type AssetRow = {
  id: string;
  assetCode?: string;
  assetName?: string;
  assetCategory?: string;
  assetType?: string;
  purchaseDate?: string;
  purchaseValue?: number;
};

export type AllocationRow = {
  id: string;
  assetId?: string;
  assetName?: string;
  employeeId?: string;
  employeeName?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const emptyAsset = () => ({
  assetCode: "",
  assetName: "",
  assetCategory: "Laptop",
  assetType: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseValue: "",
});

export function HrmsAssetsManager() {
  const { getAssets, createAsset, getAllocations, allocateAsset, loading, error } = useAssets();
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);
  const [search, setSearch] = useState("");
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [viewAsset, setViewAsset] = useState<AssetRow | null>(null);
  const [assetForm, setAssetForm] = useState(emptyAsset());
  const [allocationForm, setAllocationForm] = useState({
    assetId: "",
    employeeId: "",
    allocationReason: "",
  });

  const loadData = useCallback(async () => {
    try {
      const assetsData = await getAssets();
      const assetList = (Array.isArray(assetsData) ? assetsData : []) as AssetRow[];
      const allocationGroups = await Promise.all(
        assetList
          .map((asset) => asset.id)
          .filter((assetId): assetId is string => Boolean(assetId))
          .map((assetId) => getAllocations(undefined, assetId))
      );
      const allocationsData = allocationGroups.flatMap((group) => (Array.isArray(group) ? group : [])) as AllocationRow[];
      setAssets(assetList);
      setAllocations(allocationsData);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load assets."), "Assets");
    }
  }, [getAssets, getAllocations]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(
      (a) =>
        !q ||
        (a.assetName ?? "").toLowerCase().includes(q) ||
        (a.assetCode ?? "").toLowerCase().includes(q) ||
        (a.assetCategory ?? "").toLowerCase().includes(q)
    );
  }, [assets, search]);

  const handleAssetSubmit = async () => {
    if (!assetForm.assetCode.trim() || !assetForm.assetName.trim()) {
      notifyError("Asset code and name are required.");
      return;
    }
    try {
      await createAsset({
        ...assetForm,
        purchaseValue: Number(assetForm.purchaseValue) || 0,
        depreciation: 0,
      });
      notifySuccess("Asset created.");
      setAssetForm(emptyAsset());
      setShowAssetForm(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create asset."), "New Asset");
    }
  };

  const openAllocate = async () => {
    setShowAllocationForm(true);
    try {
      const res = await hrmsApi.hrms.employees.list(1, 100);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown })?.data)
          ? ((raw as { data: unknown[] }).data)
          : [];
      setEmployees(
        (list as Record<string, unknown>[]).map((e) => ({
          id: String(e.id),
          fullName: String(
            e.fullName ?? (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
          ),
        }))
      );
    } catch {
      setEmployees([]);
    }
  };

  const handleAllocationSubmit = async () => {
    if (!allocationForm.assetId || !allocationForm.employeeId) {
      notifyError("Asset and employee are required.");
      return;
    }
    try {
      await allocateAsset(allocationForm);
      notifySuccess("Asset allocated.");
      setAllocationForm({ assetId: "", employeeId: "", allocationReason: "" });
      setShowAllocationForm(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to allocate asset."), "Asset Allocation");
    }
  };

  const averageAssetValue = assets.length
    ? assets.reduce((sum, item) => sum + Number(item.purchaseValue || 0), 0) / assets.length
    : 0;

  return (
    <StandardPageLayout
      title="Asset Management"
      subtitle="Track physical hardware, device allocations, custodian history, and asset values."
      eyebrow="HRMS / Assets"
      icon="box"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Assets", value: assets.length, tone: "info" },
            { label: "Allocations", value: allocations.length, tone: "positive" },
            { label: "Avg value", value: formatCurrency(averageAssetValue), tone: "neutral" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void loadData()} loading={loading} />
          <button type="button" className={`${erpButtonClassName.secondary} cursor-pointer`} onClick={() => void openAllocate()}>
            Allocate
          </button>
          <ErpCreateButton label="New asset" onClick={() => setShowAssetForm(true)} />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter code, name, or category…" />}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Asset</th>
                <th className="erp-th">Category</th>
                <th className="erp-th">Purchase</th>
                <th className="erp-th">Value</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td">
                    <ErpEmptyState
                      message="No assets yet."
                      action={<ErpCreateButton label="New asset" onClick={() => setShowAssetForm(true)} />}
                    />
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="erp-tr">
                    <td className="erp-td">
                      <div className="erp-row-title">{asset.assetName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{asset.assetCode}</div>
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip">{asset.assetCategory || "Asset"}</span>
                    </td>
                    <td className="erp-td text-xs text-slate-500 dark:text-slate-400">
                      {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="erp-td text-xs font-medium">{formatCurrency(Number(asset.purchaseValue || 0))}</td>
                    <td className="erp-td">
                      <ErpRowActions
                        onView={{ label: "View", onClick: () => setViewAsset(asset) }}
                        extra={
                          <button
                            type="button"
                            className={`${erpButtonClassName.secondary} text-xs cursor-pointer`}
                            onClick={() => {
                              setAllocationForm((f) => ({ ...f, assetId: asset.id }));
                              void openAllocate();
                            }}
                          >
                            Allocate
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <CrudCard>
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">Allocations</h2>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Asset</th>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="erp-td py-6 text-center text-xs text-slate-500">
                    No allocations yet.
                  </td>
                </tr>
              ) : (
                allocations.map((row) => (
                  <tr key={row.id} className="erp-tr">
                    <td className="erp-td text-xs font-medium">{row.assetName || row.assetId}</td>
                    <td className="erp-td text-xs">{row.employeeName || row.employeeId}</td>
                    <td className="erp-td">
                      <span className="erp-chip erp-chip-success">Allocated</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer
        open={showAssetForm}
        onClose={() => setShowAssetForm(false)}
        title="New asset"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowAssetForm(false)}
            onSave={() => void handleAssetSubmit()}
            saving={loading}
            saveLabel="Create"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field">
            <label className="erp-label">Asset code *</label>
            <input
              className="erp-input"
              value={assetForm.assetCode}
              onChange={(e) => setAssetForm((f) => ({ ...f, assetCode: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Asset name *</label>
            <input
              className="erp-input"
              value={assetForm.assetName}
              onChange={(e) => setAssetForm((f) => ({ ...f, assetName: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Category</label>
            <select
              className="erp-input"
              value={assetForm.assetCategory}
              onChange={(e) => setAssetForm((f) => ({ ...f, assetCategory: e.target.value }))}
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
          <div className="erp-field">
            <label className="erp-label">Type</label>
            <input
              className="erp-input"
              value={assetForm.assetType}
              onChange={(e) => setAssetForm((f) => ({ ...f, assetType: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Purchase date</label>
            <input
              type="date"
              className="erp-input"
              value={assetForm.purchaseDate}
              onChange={(e) => setAssetForm((f) => ({ ...f, purchaseDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Purchase value (₹)</label>
            <input
              type="number"
              min={0}
              className="erp-input"
              value={assetForm.purchaseValue}
              onChange={(e) => setAssetForm((f) => ({ ...f, purchaseValue: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={showAllocationForm}
        onClose={() => setShowAllocationForm(false)}
        title="Allocate asset"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowAllocationForm(false)}
            onSave={() => void handleAllocationSubmit()}
            saving={loading}
            saveLabel="Allocate"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Asset *</label>
            <select
              className="erp-input"
              value={allocationForm.assetId}
              onChange={(e) => setAllocationForm((f) => ({ ...f, assetId: e.target.value }))}
            >
              <option value="">Select asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetName} ({a.assetCode})
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Employee *</label>
            <select
              className="erp-input"
              value={allocationForm.employeeId}
              onChange={(e) => setAllocationForm((f) => ({ ...f, employeeId: e.target.value }))}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Reason</label>
            <textarea
              className="erp-input min-h-20"
              value={allocationForm.allocationReason}
              onChange={(e) => setAllocationForm((f) => ({ ...f, allocationReason: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={Boolean(viewAsset)}
        onClose={() => setViewAsset(null)}
        title={viewAsset?.assetName || "Asset"}
        footer={
          <button type="button" className={`${erpButtonClassName.secondary} cursor-pointer`} onClick={() => setViewAsset(null)}>
            Close
          </button>
        }
      >
        {viewAsset ? (
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <span className="font-medium">Code:</span> {viewAsset.assetCode}
            </p>
            <p>
              <span className="font-medium">Category:</span> {viewAsset.assetCategory}
            </p>
            <p>
              <span className="font-medium">Type:</span> {viewAsset.assetType || "—"}
            </p>
            <p>
              <span className="font-medium">Value:</span> {formatCurrency(Number(viewAsset.purchaseValue || 0))}
            </p>
          </div>
        ) : null}
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default HrmsAssetsManager;
