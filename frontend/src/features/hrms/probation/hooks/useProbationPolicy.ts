"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import type { ProbationPolicy } from "../types/probation-policy.types";
import {
  validateProbationPolicy,
  type ProbationPolicyInput,
} from "../schemas/probation-policy.schema";

export function useProbationPolicy(initialCompanyId?: string, initialProjectId?: string) {
  const [policies, setPolicies] = useState<ProbationPolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<ProbationPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async (companyId?: string, projectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const cId = companyId !== undefined ? companyId : initialCompanyId;
      const pId = projectId !== undefined ? projectId : initialProjectId;
      const res = await hrmsApi.hrms.probation.policies.list(cId || undefined, pId || undefined);
      const rawData = res.data;
      const list: ProbationPolicy[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { items?: ProbationPolicy[] })?.items)
          ? (rawData as { items: ProbationPolicy[] }).items
          : Array.isArray((rawData as { data?: ProbationPolicy[] })?.data)
            ? (rawData as { data: ProbationPolicy[] }).data
            : [];

      setPolicies(list);
      if (list.length > 0) {
        const defaultPol = list.find((p) => p.isDefault) || list[0];
        setActivePolicy(defaultPol);
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load probation & confirmation policies from database.");
      setError(msg);
      setPolicies([]);
      setActivePolicy(null);
    } finally {
      setLoading(false);
    }
  }, [initialCompanyId, initialProjectId]);

  useEffect(() => {
    void fetchPolicies(initialCompanyId, initialProjectId);
  }, [fetchPolicies, initialCompanyId, initialProjectId]);

  const createPolicy = async (input: ProbationPolicyInput): Promise<boolean> => {
    const validation = validateProbationPolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Probation Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.probation.policies.create(input);
      notifySuccess("New confirmation & probation policy created in database.", "Probation Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create probation policy"), "Probation Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = async (id: string, input: ProbationPolicyInput): Promise<boolean> => {
    const validation = validateProbationPolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Probation Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.probation.policies.update(id, input);
      notifySuccess("Probation policy updated in database successfully.", "Probation Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update probation policy"), "Probation Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.probation.policies.delete(id);
      notifySuccess("Probation policy deleted from database.", "Probation Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete probation policy"), "Probation Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.probation.policies.setDefault(id);
      notifySuccess("Default probation policy updated in database.", "Probation Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set default probation policy"), "Probation Policy");
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
