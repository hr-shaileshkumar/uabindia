"use client";

import { useCallback, useEffect, useState } from "react";
import { travelApi } from "@/services/modules/travel";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import type { TravelExpensePolicy } from "../types/travel-policy.types";
import {
  validateTravelExpensePolicy,
  type TravelExpensePolicyInput,
} from "../schemas/travel-policy.schema";

export function useTravelPolicy(initialCompanyId?: string, initialProjectId?: string) {
  const [policies, setPolicies] = useState<TravelExpensePolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<TravelExpensePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async (companyId?: string, projectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const cId = companyId !== undefined ? companyId : initialCompanyId;
      const pId = projectId !== undefined ? projectId : initialProjectId;
      const res = await travelApi.policies.list(cId || undefined, pId || undefined);
      const rawData = res.data;
      const list: TravelExpensePolicy[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { items?: TravelExpensePolicy[] })?.items)
          ? (rawData as { items: TravelExpensePolicy[] }).items
          : Array.isArray((rawData as { data?: TravelExpensePolicy[] })?.data)
            ? (rawData as { data: TravelExpensePolicy[] }).data
            : [];

      setPolicies(list);
      if (list.length > 0) {
        const defaultPol = list.find((p) => p.isDefault) || list[0];
        setActivePolicy(defaultPol);
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load travel expense policies from database.");
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

  const createPolicy = async (input: TravelExpensePolicyInput): Promise<boolean> => {
    const validation = validateTravelExpensePolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Travel Policy");
      return false;
    }

    try {
      setSaving(true);
      await travelApi.policies.create(validation.data!);
      notifySuccess("Travel expense policy created and saved to database.", "Travel Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save travel policy"), "Travel Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = async (id: string, input: TravelExpensePolicyInput): Promise<boolean> => {
    const validation = validateTravelExpensePolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Travel Policy");
      return false;
    }

    try {
      setSaving(true);
      await travelApi.policies.update(id, validation.data!);
      notifySuccess("Travel expense policy updated in database.", "Travel Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update travel policy"), "Travel Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await travelApi.policies.delete(id);
      notifySuccess("Travel expense policy deleted from database.", "Travel Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete travel policy"), "Travel Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await travelApi.policies.setDefault(id);
      notifySuccess("Default travel expense policy updated in database.", "Travel Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set default travel policy"), "Travel Policy");
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
