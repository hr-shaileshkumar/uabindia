"use client";

import { useState, useCallback } from "react";
import apiClient from "@/services/apiClient";

export const useTraining = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTrainingPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/training/courses");
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch programs";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrainingProgram = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title ?? data.programName ?? "",
        description: data.description ?? "",
        instructor: data.instructor ?? data.provider ?? "",
        category: data.category ?? "Technical",
        level: data.level ?? "Beginner",
        durationHours: data.durationHours ?? data.duration ?? 1,
        startDate: data.startDate ?? new Date().toISOString(),
        endDate: data.endDate ?? null,
        maxParticipants: data.maxParticipants ?? data.maxEnrollments ?? 10,
        cost: data.cost ?? null,
        location: data.location ?? null,
        deliveryMode: data.deliveryMode ?? "Online",
        syllabus: data.syllabus ?? null,
        prerequisiteSkills: data.prerequisiteSkills ?? null,
      };

      const response = await apiClient.post("/training/courses", payload);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create program";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollEmployee = useCallback(async (programId: string, employeeId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/training/enrollments", {
        courseId: programId,
        employeeId,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enroll";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEnrollments = useCallback(async (employeeId?: string) => {
    setLoading(true);
    try {
      if (!employeeId) {
        throw new Error("employeeId is required to fetch enrollments");
      }
      const response = await apiClient.get(`/training/enrollments/employee/${employeeId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch enrollments";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeEnrollment = useCallback(async (enrollmentId: string, score?: number) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/training/enrollments/${enrollmentId}`, { score, isCompleted: true });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete enrollment";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCertifications = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/training/certificates/employee/${employeeId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch certifications";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssessmentsByEnrollment = useCallback(async (enrollmentId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/training/assessments/enrollment/${enrollmentId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch assessments";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCertification = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/training/certificates", data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add certification";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTrainingPrograms,
    createTrainingProgram,
    enrollEmployee,
    getEnrollments,
    completeEnrollment,
    getCertifications,
    getAssessmentsByEnrollment,
    addCertification,
  };
};
