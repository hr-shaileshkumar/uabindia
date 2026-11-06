"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "@/services/modules/payroll";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  DEFAULT_FALLBACK_PAYROLL_POLICY,
  type PayrollPolicy,
} from "../types/payroll-policy.types";
import {
  validatePayrollPolicy,
  type PayrollPolicyInput,
} from "../schemas/payroll-policy.schema";

export function usePayrollPolicy() {
  const [policies, setPolicies] = useState<PayrollPolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<PayrollPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollApi.policies.list();
      const rawData = res.data;
      const list: PayrollPolicy[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { items?: PayrollPolicy[] })?.items)
          ? (rawData as { items: PayrollPolicy[] }).items
          : [];

      setPolicies(list);
      if (list.length > 0) {
        const defaultPol = list.find((p) => p.isDefault) || list[0];
        setActivePolicy(defaultPol);
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load payroll policies from database.");
      setError(msg);
      setPolicies([]);
      setActivePolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  const createPolicy = async (input: PayrollPolicyInput): Promise<boolean> => {
    const validation = validatePayrollPolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Payroll Policy");
      return false;
    }

    try {
      setSaving(true);
      await payrollApi.policies.create(validation.data!);
      notifySuccess("Payroll compensation policy saved to database.", "Payroll Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save payroll policy"), "Payroll Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = async (id: string, input: PayrollPolicyInput): Promise<boolean> => {
    const validation = validatePayrollPolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Payroll Policy");
      return false;
    }

    try {
      setSaving(true);
      await payrollApi.policies.update(id, validation.data!);
      notifySuccess("Payroll policy updated in database.", "Payroll Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update payroll policy"), "Payroll Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await payrollApi.policies.delete(id);
      notifySuccess("Payroll policy deleted from database.", "Payroll Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete payroll policy"), "Payroll Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await payrollApi.policies.setDefault(id);
      notifySuccess("Default organization payroll policy updated.", "Payroll Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set default payroll policy"), "Payroll Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    policies,
    activePolicy,
    loading,
    saving,
    error,
    refresh: fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    setDefaultPolicy,
    setActivePolicy,
  };
}
