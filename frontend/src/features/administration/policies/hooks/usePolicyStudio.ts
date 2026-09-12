"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { policyApi } from "@/services/modules/policies";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import type {
  PolicyMaster,
  PolicyCategory,
  PolicyImpactSimulationInput,
  PolicyImpactSimulationResult,
  PolicyUiSchemaResponse,
} from "../types/policy-matrix.types";
import { simulatePolicyImpact } from "../utils/policy-engine";
import {
  policyMasterSchema,
  policyVersionSchema,
  type PolicyMasterFormValues,
  type PolicyVersionFormValues,
} from "../schemas/policy-master.schema";

export function usePolicyStudio() {
  const [policies, setPolicies] = useState<PolicyMaster[]>([]);
  const [uiSchema, setUiSchema] = useState<PolicyUiSchemaResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePolicy, setActivePolicy] = useState<PolicyMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [simulationResult, setSimulationResult] = useState<PolicyImpactSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchUiSchema = useCallback(async () => {
    try {
      const res = await policyApi.getUiSchema();
      if (res?.data) {
        setUiSchema(res.data as PolicyUiSchemaResponse);
      }
    } catch {
      // Backend UI schema unavailable or running offline
      setUiSchema(null);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyApi.list();
      const raw = res.data;
      const list: PolicyMaster[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { items?: PolicyMaster[] })?.items)
          ? (raw as { items: PolicyMaster[] }).items
          : Array.isArray((raw as { data?: PolicyMaster[] })?.data)
            ? (raw as { data: PolicyMaster[] }).data
            : [];

      setPolicies(list);
      if (list.length > 0) {
        setActivePolicy((prev) => (prev ? list.find((p) => p.id === prev.id) || list[0] : list[0]));
      } else {
        setActivePolicy(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load policies from backend database.");
      setError(msg);
      setPolicies([]);
      setActivePolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUiSchema();
    void fetchPolicies();
  }, [fetchUiSchema, fetchPolicies]);

  // Filtered policies list based on backend-allowed categories & search
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchCategory = selectedCategory === "ALL" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [policies, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    policies.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [policies]);

  const createPolicyMaster = async (input: PolicyMasterFormValues): Promise<boolean> => {
    const parse = policyMasterSchema.safeParse(input);
    if (!parse.success) {
      notifyError(parse.error.issues.map((i) => i.message).join(", "), "Policy Master");
      return false;
    }

    try {
      setSaving(true);
      const res = await policyApi.create(parse.data as unknown as Record<string, unknown>);
      const created = res.data as PolicyMaster;
      notifySuccess(`Policy ${parse.data.name} created and registered in database.`, "Policy Studio");
      await fetchPolicies();
      if (created) setActivePolicy(created);
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create policy in database"), "Policy Studio");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createNewVersion = async (policyId: string, input: PolicyVersionFormValues): Promise<boolean> => {
    const parse = policyVersionSchema.safeParse(input);
    if (!parse.success) {
      notifyError(parse.error.issues.map((i) => i.message).join(", "), "Policy Version");
      return false;
    }

    try {
      setSaving(true);
      await policyApi.versions.create(policyId, parse.data as unknown as Record<string, unknown>);
      notifySuccess(`Version ${parse.data.version} published and enforced in database.`, "Policy Studio");
      await fetchPolicies();
      return true;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create policy version in database"), "Policy Studio");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const runImpactSimulation = async (input: PolicyImpactSimulationInput) => {
    setIsSimulating(true);
    try {
      const res = await policyApi.simulate(input as unknown as Record<string, unknown>);
      if (res?.data) {
        setSimulationResult(res.data as PolicyImpactSimulationResult);
        notifySuccess("Backend-governed policy impact simulation computed from database.", "Simulation Engine");
        return;
      }
      throw new Error("No simulation data received from backend.");
    } catch (err) {
      try {
        const fallback = simulatePolicyImpact(input);
        setSimulationResult(fallback);
        notifySuccess("Policy simulation generated (offline mode).", "Simulation Engine");
      } catch {
        notifyError(getApiErrorMessage(err, "Backend simulation failed"), "Simulation Engine");
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    policies: filteredPolicies,
    rawPolicies: policies,
    uiSchema,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activePolicy,
    setActivePolicy,
    loading,
    saving,
    error,
    categoryCounts,
    simulationResult,
    isSimulating,
    fetchPolicies,
    fetchUiSchema,
    createPolicyMaster,
    createNewVersion,
    runImpactSimulation,
  };
}
