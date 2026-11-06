"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmsApi } from "@/services/modules/hrms";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  DEFAULT_FALLBACK_LEAVE_POLICY,
  type LeavePolicy,
} from "../types/leave-policy.types";
import {
  leavePolicySchema,
  type LeavePolicyFormValues,
} from "../schemas/leave-policy.schema";

export function useLeavePolicy(initialCompanyId?: string, initialProjectId?: string) {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<LeavePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async (companyId?: string, projectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const cId = companyId !== undefined ? companyId : initialCompanyId;
      const pId = projectId !== undefined ? projectId : initialProjectId;
      const res = await hrmsApi.hrms.leave.policies.list(cId || undefined, pId || undefined);
      const rawData = res.data;
      const list: LeavePolicy[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { items?: LeavePolicy[] })?.items)
          ? (rawData as { items: LeavePolicy[] }).items
          : Array.isArray((rawData as { data?: LeavePolicy[] })?.data)
            ? (rawData as { data: LeavePolicy[] }).data
            : [];

      setPolicies(list);
      if (list.length > 0) {
        const defaultPol = list.find((p) => p.isDefault) || list[0];
        setActivePolicy(defaultPol);
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load leave policies from backend database.");
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

  const createPolicy = async (input: LeavePolicyFormValues): Promise<boolean> => {
    const parseResult = leavePolicySchema.safeParse(input);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((e) => e.message).join(", ");
      notifyError(msg || "Policy validation failed", "Leave Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.leave.policies.create(parseResult.data);
      notifySuccess("Leave policy created and saved to database.", "Leave Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save leave policy"), "Leave Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = async (id: string, input: LeavePolicyFormValues): Promise<boolean> => {
    const parseResult = leavePolicySchema.safeParse(input);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((e) => e.message).join(", ");
      notifyError(msg || "Policy validation failed", "Leave Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.leave.policies.update(id, parseResult.data);
      notifySuccess("Leave policy updated in database.", "Leave Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update leave policy"), "Leave Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.leave.policies.delete(id);
      notifySuccess("Policy deleted from database.", "Leave Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete policy"), "Leave Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.leave.policies.setDefault(id);
      notifySuccess("Default leave policy updated.", "Leave Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set default policy"), "Leave Policy");
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
    fetchPolicies,
    setActivePolicy,
    createPolicy,
    updatePolicy,
    deletePolicy,
    setDefaultPolicy,
  };
}
