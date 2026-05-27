"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
}

export default function PasswordPoliciesPage() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await hrApi.security.passwordPolicy();
      setPolicy(res.data);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Password & Access Policies</h2>
        <p className="text-sm text-gray-500">Current security policy configuration.</p>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-700">
        {policy ? (
          <ul className="space-y-2">
            <li>Minimum Length: {policy.minLength}</li>
            <li>Require Uppercase: {policy.requireUppercase ? "Yes" : "No"}</li>
            <li>Require Lowercase: {policy.requireLowercase ? "Yes" : "No"}</li>
            <li>Require Number: {policy.requireNumber ? "Yes" : "No"}</li>
            <li>Require Special: {policy.requireSpecial ? "Yes" : "No"}</li>
            <li>Max Age (days): {policy.maxAgeDays}</li>
          </ul>
        ) : (
          "Loading..."
        )}
      </div>
    </div>
  );
}
