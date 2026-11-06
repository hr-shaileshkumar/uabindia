"use client";

import { useState, useCallback } from "react";
import apiClient from "@/services/apiClient";

export const useRecruitment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getJobPostings = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status.toLowerCase() === "active"
        ? "/recruitment/job-postings/active"
        : "/recruitment/job-postings";
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.jobPostings ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch job postings";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createJobPosting = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title ?? data.jobTitle ?? "",
        description: data.description ?? data.jobDescription ?? "",
        department: data.department ?? "",
        location: data.location ?? "Remote",
        level: data.level ?? "MidLevel",
        jobType: data.jobType ?? "FullTime",
        minSalary: data.minSalary ?? 0,
        maxSalary: data.maxSalary ?? 0,
        requiredSkills: data.requiredSkills ?? "",
        niceToHaveSkills: data.niceToHaveSkills ?? "",
        closingDate: data.closingDate ?? new Date().toISOString(),
        numberOfPositions: data.numberOfPositions ?? 1,
      };

      const response = await apiClient.post("/recruitment/job-postings", payload);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create job posting";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCandidates = useCallback(async (jobPostingId?: string) => {
    setLoading(true);
    try {
      if (!jobPostingId) {
        throw new Error("jobPostingId is required to fetch candidates");
      }
      const url = `/recruitment/job-postings/${jobPostingId}/candidates`;
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.candidates ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch candidates";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCandidate = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/recruitment/apply", data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create candidate";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getApplications = useCallback(async (jobPostingId?: string) => {
    setLoading(true);
    try {
      if (!jobPostingId) {
        throw new Error("jobPostingId is required to fetch applications");
      }
      const response = await apiClient.get(`/recruitment/job-postings/${jobPostingId}/candidates`);
      setError(null);
      return response.data?.candidates ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch applications";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createApplication = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/recruitment/apply", data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create application";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: string) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/recruitment/candidates/${applicationId}`, { status });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update application";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleInterview = useCallback(async (applicationId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/recruitment/candidates/${applicationId}/screenings`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to schedule interview";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitInterviewFeedback = useCallback(async (interviewId: string, feedbackData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/recruitment/screenings/${interviewId}/submit`, feedbackData);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit feedback";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getJobPostings,
    createJobPosting,
    getCandidates,
    createCandidate,
    getApplications,
    createApplication,
    updateApplicationStatus,
    scheduleInterview,
    submitInterviewFeedback,
  };
};
