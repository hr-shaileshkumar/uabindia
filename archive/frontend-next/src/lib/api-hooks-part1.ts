'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// Performance Appraisal Hooks
export const usePerformanceAppraisals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAppraisals = useCallback(async (employeeId?: string) => {
    setLoading(true);
    try {
      const url = employeeId
        ? `/api/v1/appraisals?page=1&limit=20`
        : '/api/v1/appraisals?page=1&limit=20';
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.appraisals ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch appraisals';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppraisal = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/appraisals', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appraisal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppraisal = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/v1/appraisals/${id}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appraisal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAppraisal = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/appraisals/${id}/self-assess`, {});
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit appraisal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAppraisal = useCallback(async (id: string, comments?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/appraisals/${id}/approve`, { comments });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve appraisal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppraisalPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/appraisals/cycles');
      setError(null);
      return response.data?.cycles ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch periods';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (appraisalId: string, goalData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/appraisals/competencies`, goalData);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add goal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAppraisals,
    createAppraisal,
    updateAppraisal,
    submitAppraisal,
    approveAppraisal,
    getAppraisalPeriods,
    addGoal,
  };
};

// Recruitment Hooks
export const useRecruitment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getJobPostings = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status.toLowerCase() === 'active'
        ? '/api/v1/recruitment/job-postings/active'
        : '/api/v1/recruitment/job-postings';
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.jobPostings ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job postings';
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
        title: data.title ?? data.jobTitle ?? '',
        description: data.description ?? data.jobDescription ?? '',
        department: data.department ?? '',
        location: data.location ?? 'Remote',
        level: data.level ?? 'MidLevel',
        jobType: data.jobType ?? 'FullTime',
        minSalary: data.minSalary ?? 0,
        maxSalary: data.maxSalary ?? 0,
        requiredSkills: data.requiredSkills ?? '',
        niceToHaveSkills: data.niceToHaveSkills ?? '',
        closingDate: data.closingDate ?? new Date().toISOString(),
        numberOfPositions: data.numberOfPositions ?? data.numberOfPositions ?? 1,
      };

      const response = await apiClient.post('/api/v1/recruitment/job-postings', payload);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job posting';
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
        throw new Error('jobPostingId is required to fetch candidates');
      }
      const url = `/api/v1/recruitment/job-postings/${jobPostingId}/candidates`;
      const response = await apiClient.get(url);
      setError(null);
      return response.data?.candidates ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candidates';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCandidate = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/recruitment/apply', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create candidate';
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
        throw new Error('jobPostingId is required to fetch applications');
      }
      const response = await apiClient.get(`/api/v1/recruitment/job-postings/${jobPostingId}/candidates`);
      setError(null);
      return response.data?.candidates ?? response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createApplication = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/recruitment/apply', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create application';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: string) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/v1/recruitment/candidates/${applicationId}`, { status });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleInterview = useCallback(async (applicationId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/recruitment/candidates/${applicationId}/screenings`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule interview';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitInterviewFeedback = useCallback(async (interviewId: string, feedbackData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/v1/recruitment/screenings/${interviewId}/submit`, feedbackData);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
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

// Training Hooks
export const useTraining = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTrainingPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/training/courses');
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch programs';
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
        title: data.title ?? data.programName ?? '',
        description: data.description ?? '',
        instructor: data.instructor ?? data.provider ?? '',
        category: data.category ?? 'Technical',
        level: data.level ?? 'Beginner',
        durationHours: data.durationHours ?? data.duration ?? 1,
        startDate: data.startDate ?? new Date().toISOString(),
        endDate: data.endDate ?? null,
        maxParticipants: data.maxParticipants ?? data.maxEnrollments ?? 10,
        cost: data.cost ?? null,
        location: data.location ?? null,
        deliveryMode: data.deliveryMode ?? 'Online',
        syllabus: data.syllabus ?? null,
        prerequisiteSkills: data.prerequisiteSkills ?? null,
      };

      const response = await apiClient.post('/api/v1/training/courses', payload);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create program';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollEmployee = useCallback(async (programId: string, employeeId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/training/enrollments', {
        courseId: programId,
        employeeId
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enroll';
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
        throw new Error('employeeId is required to fetch enrollments');
      }
      const response = await apiClient.get(`/api/v1/training/enrollments/employee/${employeeId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeEnrollment = useCallback(async (enrollmentId: string, score?: number) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/v1/training/enrollments/${enrollmentId}`, { score, isCompleted: true });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete enrollment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCertifications = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/training/certificates/employee/${employeeId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch certifications';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssessmentsByEnrollment = useCallback(async (enrollmentId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/training/assessments/enrollment/${enrollmentId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assessments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCertification = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/training/certificates', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add certification';
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
