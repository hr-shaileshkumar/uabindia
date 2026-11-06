"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmsApi } from "@/services/modules/hrms";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  DEFAULT_FALLBACK_ATTENDANCE_POLICY,
  type AttendancePolicy,
} from "../types/attendance-policy.types";
import {
  validateAttendancePolicy,
  type AttendancePolicyInput,
} from "../schemas/attendance-policy.schema";

export function useAttendancePolicy(initialCompanyId?: string, initialProjectId?: string) {
  const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<AttendancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async (companyId?: string, projectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const cId = companyId !== undefined ? companyId : initialCompanyId;
      const pId = projectId !== undefined ? projectId : initialProjectId;
      const res = await hrmsApi.hrms.attendance.policies.list(cId || undefined, pId || undefined);
      const rawData = res.data;
      const list: AttendancePolicy[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { items?: AttendancePolicy[] })?.items)
          ? (rawData as { items: AttendancePolicy[] }).items
          : [];

      setPolicies(list);
      if (list.length > 0) {
        const defaultPol = list.find((p) => p.isDefault) || list[0];
        setActivePolicy(defaultPol);
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load attendance policies from backend database.");
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

  const createPolicy = async (input: AttendancePolicyInput): Promise<boolean> => {
    const validation = validateAttendancePolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Attendance Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.attendance.policies.create(validation.data!);
      notifySuccess("Attendance policy created and saved to database.", "Attendance Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save attendance policy"), "Attendance Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = async (id: string, input: AttendancePolicyInput): Promise<boolean> => {
    const validation = validateAttendancePolicy(input);
    if (!validation.success) {
      notifyError(validation.error || "Policy validation failed", "Attendance Policy");
      return false;
    }

    try {
      setSaving(true);
      await hrmsApi.hrms.attendance.policies.update(id, validation.data!);
      notifySuccess("Attendance policy updated in database.", "Attendance Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update attendance policy"), "Attendance Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.attendance.policies.delete(id);
      notifySuccess("Policy deleted from database.", "Attendance Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete policy"), "Attendance Policy");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPolicy = async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      await hrmsApi.hrms.attendance.policies.setDefault(id);
      notifySuccess("Default attendance policy updated.", "Attendance Policy");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set default policy"), "Attendance Policy");
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
