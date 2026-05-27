"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/lib/hrApi";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p className="text-sm text-gray-600 mt-1">Manage financial account structure</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

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
                <div className="py-10 text-center text-gray-500">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No accounts found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Sub Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{account.accountCode}</td>
                          <td className="px-4 py-3 text-gray-700">{account.accountName}</td>
                          <td className="px-4 py-3 text-gray-600">{account.accountType}</td>
                          <td className="px-4 py-3 text-gray-600">{account.subType}</td>
                          <td className="px-4 py-3 text-gray-600">
                            ₹{(account.currentBalance || 0).toLocaleString()}
                          </td>
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
                  <label className="text-sm font-medium text-gray-600">Account Code</label>
                  <input
                    name="accountCode"
                    value={formData.accountCode}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Name</label>
                  <input
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Type</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleTypeChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sub Type</label>
                  <select
                    name="subType"
                    value={formData.subType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {(SUB_TYPES[formData.accountType] || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Group</label>
                  <select
                    name="isGroup"
                    value={formData.isGroup ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isGroup: e.target.value === "true" }))
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="false">Normal Account</option>
                    <option value="true">Group Header</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Opening Balance</label>
                  <input
                    name="openingBalance"
                    type="number"
                    value={formData.openingBalance}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <input
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>Save Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
