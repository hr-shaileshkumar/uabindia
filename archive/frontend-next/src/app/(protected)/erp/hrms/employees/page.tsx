"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function EmployeesMasterPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const page = 1;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await hrApi.hrms.employees.list(page);
        setEmployees(res.data?.employees || []);
      } catch (err: any) {
        setError(err.message || "Failed to load employees");
        console.error("Error loading employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Master</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your organization&apos;s employees</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
          Add Employee
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Loading employees...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {employees.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">No employees found</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-900">{emp.name || "N/A"}</td>
                      <td className="px-6 py-3 text-gray-600">{emp.email || "N/A"}</td>
                      <td className="px-6 py-3 text-gray-600">{emp.role || "N/A"}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          emp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-green-600 hover:text-green-700 font-medium text-xs">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
