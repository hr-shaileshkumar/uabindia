'use client';

import { useState, useCallback } from 'react';
import apiClient from '@/services/apiClient';

// Performance Appraisal Hooks
export const usePerformanceAppraisals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAppraisals = useCallback(async (employeeId?: string) => {
    setLoading(true);
    try {
      const url = employeeId
        ? `/appraisals?page=1&limit=20`
        : '/appraisals?page=1&limit=20';
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
      const response = await apiClient.post('/appraisals', data);
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
      const response = await apiClient.put(`/appraisals/${id}`, data);
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
      const response = await apiClient.post(`/appraisals/${id}/self-assess`, {});
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
      const response = await apiClient.post(`/appraisals/${id}/approve`, { comments });
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
      const response = await apiClient.get('/appraisals/cycles');
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
      const response = await apiClient.post(`/appraisals/competencies`, goalData);
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
        ? '/recruitment/job-postings/active'
        : '/recruitment/job-postings';
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

      const response = await apiClient.post('/recruitment/job-postings', payload);
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
      const url = `/recruitment/job-postings/${jobPostingId}/candidates`;
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
      const response = await apiClient.post('/recruitment/apply', data);
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
      const response = await apiClient.get(`/recruitment/job-postings/${jobPostingId}/candidates`);
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
      const response = await apiClient.post('/recruitment/apply', data);
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
      const response = await apiClient.put(`/recruitment/candidates/${applicationId}`, { status });
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
      const response = await apiClient.post(`/recruitment/candidates/${applicationId}/screenings`, data);
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
      const response = await apiClient.post(`/recruitment/screenings/${interviewId}/submit`, feedbackData);
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
      const response = await apiClient.get('/training/courses');
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

      const response = await apiClient.post('/training/courses', payload);
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
      const response = await apiClient.post('/training/enrollments', {
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
      const response = await apiClient.get(`/training/enrollments/employee/${employeeId}`);
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
      const response = await apiClient.put(`/training/enrollments/${enrollmentId}`, { score, isCompleted: true });
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
      const response = await apiClient.get(`/training/certificates/employee/${employeeId}`);
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
      const response = await apiClient.get(`/training/assessments/enrollment/${enrollmentId}`);
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
      const response = await apiClient.post('/training/certificates', data);
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

// ===== Additional HRMS hooks =====

// Asset Management Hooks
export const useAssets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssets = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      if (category) {
        const response = await apiClient.get(`/assets/assets/category/${encodeURIComponent(category)}`);
        setError(null);
        return response.data;
      }

      const url = '/assets/assets';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAsset = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assets/assets', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAsset = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/assets/assets/${id}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllocations = useCallback(async (employeeId?: string, assetId?: string) => {
    setLoading(true);
    try {
      if (assetId) {
        const response = await apiClient.get(`/assets/allocations/asset/${assetId}`);
        setError(null);
        return response.data;
      }

      if (employeeId) {
        const response = await apiClient.get(`/assets/allocations/employee/${employeeId}`);
        setError(null);
        return response.data;
      }

      throw new Error('assetId or employeeId is required to fetch allocations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch allocations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const allocateAsset = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assets/allocations', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to allocate asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const returnAsset = useCallback(async (allocationId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/assets/allocations/${allocationId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to return asset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleMaintenance = useCallback(async (assetId: string, data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/assets/maintenance', { assetId, ...data });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule maintenance';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepreciation = useCallback(async (assetId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/assets/maintenance/asset/${assetId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch depreciation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAssets,
    createAsset,
    updateAsset,
    getAllocations,
    allocateAsset,
    returnAsset,
    scheduleMaintenance,
    getDepreciation,
  };
};

// Shift Management Hooks
export const useShifts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getShifts = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status.toLowerCase() === 'active'
        ? '/shifts/shifts/active'
        : '/shifts/shifts';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createShift = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/shifts', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignShift = useCallback(async (employeeId: string, shiftId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/assignments', {
        employeeId,
        shiftId
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign shift';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoster = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/shifts/assignments');
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roster';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishRoster = useCallback(async () => {
    setLoading(true);
    try {
      throw new Error('Roster publishing is not supported by the backend yet');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish roster';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestShiftSwap = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/shifts/swaps', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request swap';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveShiftSwap = useCallback(async (swapId: string, approved: boolean, notes?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/shifts/swaps/${swapId}`, {
        approved,
        notes
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve swap';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getShifts,
    createShift,
    assignShift,
    getRoster,
    publishRoster,
    requestShiftSwap,
    approveShiftSwap,
  };
};

// Overtime Tracking Hooks
export const useOvertime = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOvertimeRequest = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/overtime/requests', data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOvertimeRequests = useCallback(async (employeeId?: string, status?: string, month?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);
      if (status) params.append('status', status);
      if (month) params.append('month', month);
      const url = params.toString() ? `/overtime/requests?${params}` : '/overtime/requests';
      const response = await apiClient.get(url);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOvertimeRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Pending'
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveOvertimeRequest = useCallback(async (requestId: string, comments?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Approved',
        approvalNotes: comments
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOvertimeRequest = useCallback(async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/approvals`, {
        overtimeRequestId: requestId,
        status: 'Rejected',
        rejectionReason: reason
      });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processCompensation = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/overtime/logs`, { month });
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process compensation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOvertimeReport = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/overtime/logs?month=${encodeURIComponent(month)}`);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOvertimeRequest,
    getOvertimeRequests,
    submitOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    processCompensation,
    getOvertimeReport,
  };
};
