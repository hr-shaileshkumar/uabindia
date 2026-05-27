"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ChartOfAccount = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  subType: string;
  isGroup: boolean;
  description?: string;
  currentBalance?: number;
};

type AccountForm = {
  accountCode: string;
  accountName: string;
  accountType: string;
  subType: string;
  isGroup: boolean;
  openingBalance: number;
  description: string;
};

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense", "Contra"];

const SUB_TYPES: Record<string, string[]> = {
  Asset: ["Current Asset", "Non-Current Asset", "Fixed Asset"],
  Liability: ["Current Liability", "Long-Term Liability"],
  Equity: ["Share Capital", "Retained Earnings", "Reserves"],
  Income: ["Operating Income", "Non-Operating Income"],
  Expense: ["Operating Expense", "Non-Operating Expense"],
  Contra: ["Contra Asset", "Contra Liability"],
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [formData, setFormData] = useState<AccountForm>({
    accountCode: "",
    accountName: "",
    accountType: "Asset",
    subType: "Current Asset",
    isGroup: false,
    openingBalance: 0,
    description: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await hrApi.erp.chartOfAccounts.getAll();
      setAccounts(response.data || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch accounts";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const subTypes = SUB_TYPES[value] || [];
    setFormData((prev) => ({
      ...prev,
      accountType: value,
      subType: subTypes[0] || "",
    }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.accountName.trim() || !formData.accountCode.trim()) {
      setError("Account name and code are required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        accountType: formData.accountType,
        subType: formData.subType,
        isGroup: formData.isGroup,
        openingBalance: formData.openingBalance,
        description: formData.description,
      };
      await hrApi.erp.chartOfAccounts.create(payload);
      setActiveTab("list");
      setFormData({
        accountCode: "",
        accountName: "",
        accountType: "Asset",
        subType: "Current Asset",
        isGroup: false,
        openingBalance: 0,
        description: "",
      });
      await fetchAccounts();
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save account";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Chart of accounts" subtitle="Manage financial account structure">
      {error && <div className="erp-alert-error text-sm font-medium">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Accounts</p><p className="erp-kpi-value">{accounts.length}</p><p className="erp-kpi-meta">Chart of accounts entries</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Account Types</p><p className="erp-kpi-value">{new Set(accounts.map(a => a.accountType)).size}</p><p className="erp-kpi-meta">Distinct account categories</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Ledger Accounts</p><p className="erp-kpi-value erp-kpi-value-success">{accounts.filter(a => !a.isGroup).length}</p><p className="erp-kpi-meta">Postable accounts</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Group Accounts</p><p className="erp-kpi-value">{accounts.filter(a => a.isGroup).length}</p><p className="erp-kpi-meta">Structural groupings</p></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Account List</TabsTrigger>
          <TabsTrigger value="form">New Account</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Accounts</CardTitle>
              <Button onClick={() => setActiveTab("form")}>Add Account</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="erp-loading py-10">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="erp-empty py-10">No accounts found.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Code</th>
                        <th className="erp-th">Name</th>
                        <th className="erp-th">Type</th>
                        <th className="erp-th">Sub type</th>
                        <th className="erp-th">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{account.accountCode}</td>
                          <td className="erp-td text-slate-800">{account.accountName}</td>
                          <td className="erp-td">{account.accountType}</td>
                          <td className="erp-td">{account.subType}</td>
                          <td className="erp-td tabular-nums">₹{(account.currentBalance || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Account code</label>
                  <input
                    name="accountCode"
                    value={formData.accountCode}
                    onChange={handleChange}
                    className="erp-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Account name</label>
                  <input
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className="erp-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Account type</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleTypeChange}
                    className="erp-select mt-1"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Sub type</label>
                  <select
                    name="subType"
                    value={formData.subType}
                    onChange={handleChange}
                    className="erp-select mt-1"
                  >
                    {(SUB_TYPES[formData.accountType] || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Account group</label>
                  <select
                    name="isGroup"
                    value={formData.isGroup ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isGroup: e.target.value === "true" }))
                    }
                    className="erp-select mt-1"
                  >
                    <option value="false">Normal Account</option>
                    <option value="true">Group Header</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Opening balance</label>
                  <input
                    name="openingBalance"
                    type="number"
                    value={formData.openingBalance}
                    onChange={handleChange}
                    className="erp-input mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="erp-input mt-1"
                  />
                </div>
              </div>

              <div className="erp-form-actions">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>Save Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
