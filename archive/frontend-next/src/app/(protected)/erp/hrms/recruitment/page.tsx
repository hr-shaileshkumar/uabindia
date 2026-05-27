'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRecruitment } from '@/lib/api-hooks-part1';

export default function RecruitmentPage() {
  const {
    getJobPostings,
    createJobPosting,
    getApplications,
    updateApplicationStatus,
    scheduleInterview,
    submitInterviewFeedback,
    loading,
    error,
  } = useRecruitment();

  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [screeningDrafts, setScreeningDrafts] = useState<Record<string, any>>({});
  const [screeningResults, setScreeningResults] = useState<Record<string, any>>({});
  const [screeningIds, setScreeningIds] = useState<Record<string, string>>({});
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [feedbackCandidateId, setFeedbackCandidateId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({
    jobTitle: '',
    jobDescription: '',
    department: '',
    location: '',
    level: 'MidLevel',
    jobType: 'FullTime',
    numberOfPositions: 1,
    experienceRequired: 0,
    minSalary: 0,
    maxSalary: 0,
    requiredSkills: '',
    niceToHaveSkills: '',
    closingDate: '',
  });

  const loadData = useCallback(async () => {
    try {
      const jobsData = await getJobPostings('Open');
      const firstJobId = jobsData?.[0]?.id;
      const jobId = selectedJobId || firstJobId || null;
      const appData = jobId ? await getApplications(jobId) : [];
      setJobs(jobsData || []);
      setSelectedJobId(jobId);
      setApplications(appData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [getJobPostings, getApplications, selectedJobId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleJobSelect = async (jobId: string) => {
    setSelectedJobId(jobId);
    try {
      const appData = await getApplications(jobId);
      setApplications(appData || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const handleStatusChange = async (candidateId: string, status: string) => {
    try {
      await updateApplicationStatus(candidateId, status);
      setApplications((prev: any[]) =>
        prev.map((app) => (app.id === candidateId ? { ...app, status } : app))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleScheduleScreening = async (candidateId: string) => {
    const draft = screeningDrafts[candidateId];
    if (!draft?.scheduledDate) return;

    try {
      const response = await scheduleInterview(candidateId, {
        screeningType: draft.screeningType || "Interview",
        scheduledDate: new Date(draft.scheduledDate).toISOString(),
        interviewer: draft.interviewer || "",
      });
      const screeningId = response?.screening?.id;
      if (screeningId) {
        setScreeningIds((prev) => ({ ...prev, [candidateId]: screeningId }));
      }
      setExpandedCandidateId(null);
    } catch (err) {
      console.error("Failed to schedule screening:", err);
    }
  };

  const handleSubmitScreening = async (candidateId: string) => {
    const screeningId = screeningIds[candidateId];
    const results = screeningResults[candidateId];
    if (!screeningId) return;

    try {
      await submitInterviewFeedback(screeningId, {
        status: results?.status || "Completed",
        technicalSkillsRating: results?.technicalSkillsRating || "Average",
        communicationRating: results?.communicationRating || "Average",
        culturalFitRating: results?.culturalFitRating || "Average",
        overallScore: results?.overallScore ? Number(results.overallScore) : undefined,
        comments: results?.comments || "",
      });
      setFeedbackCandidateId(null);
    } catch (err) {
      console.error("Failed to submit screening:", err);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJobPosting(jobForm);
      setJobForm({
        jobTitle: '',
        jobDescription: '',
        department: '',
        location: '',
        level: 'MidLevel',
        jobType: 'FullTime',
        numberOfPositions: 1,
        experienceRequired: 0,
        minSalary: 0,
        maxSalary: 0,
        requiredSkills: '',
        niceToHaveSkills: '',
        closingDate: '',
      });
      setShowJobForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recruitment Management</h1>
        <button
          onClick={() => setShowJobForm(!showJobForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Post New Job
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showJobForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create Job Posting</h2>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Title</label>
              <input
                type="text"
                value={jobForm.jobTitle}
                onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Job Description</label>
              <textarea
                value={jobForm.jobDescription}
                onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <input
                  type="text"
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Level</label>
                <select
                  value={jobForm.level}
                  onChange={(e) => setJobForm({ ...jobForm, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="EntryLevel">Entry Level</option>
                  <option value="MidLevel">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <select
                  value={jobForm.jobType}
                  onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Positions</label>
                <input
                  type="number"
                  value={jobForm.numberOfPositions}
                  onChange={(e) => setJobForm({ ...jobForm, numberOfPositions: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Min Salary</label>
                <input
                  type="number"
                  value={jobForm.minSalary}
                  onChange={(e) => setJobForm({ ...jobForm, minSalary: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Salary</label>
              <input
                type="number"
                value={jobForm.maxSalary}
                onChange={(e) => setJobForm({ ...jobForm, maxSalary: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Skills (Required)</label>
              <input
                type="text"
                value={jobForm.requiredSkills}
                onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Skills (Nice to Have)</label>
              <input
                type="text"
                value={jobForm.niceToHaveSkills}
                onChange={(e) => setJobForm({ ...jobForm, niceToHaveSkills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Closing Date</label>
              <input
                type="date"
                value={jobForm.closingDate}
                onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Job Postings</h2>
          {jobs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Job</label>
              <select
                value={selectedJobId || ''}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {jobs.map((job: any) => (
                  <option key={job.id} value={job.id}>
                    {job.title || 'Job Posting'}
                  </option>
                ))}
              </select>
            </div>
          )}
          {jobs.length === 0 ? (
            <div className="text-sm text-gray-500">No job postings.</div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div key={job.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{job.title || "Job Posting"}</div>
                  <div className="text-xs text-gray-500">{job.department} • {job.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Applications</h2>
          {applications.length === 0 ? (
            <div className="text-sm text-gray-500">No applications.</div>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div key={app.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{`${app.firstName || ""} ${app.lastName || ""}`.trim() || "Candidate"}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{app.status}</span>
                    <select
                      className="ml-auto rounded border border-gray-300 px-2 py-1 text-xs"
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="ScreeningInProgress">Screening In Progress</option>
                      <option value="InterviewInvited">Interview Invited</option>
                      <option value="InterviewScheduled">Interview Scheduled</option>
                      <option value="InterviewCompleted">Interview Completed</option>
                      <option value="RoundTwo">Round Two</option>
                      <option value="FinalRound">Final Round</option>
                      <option value="OfferExtended">Offer Extended</option>
                      <option value="OfferAccepted">Offer Accepted</option>
                      <option value="Joined">Joined</option>
                      <option value="Rejected">Rejected</option>
                      <option value="WithdrawnByCandidate">Withdrawn</option>
                    </select>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                      onClick={() =>
                        setExpandedCandidateId((prev) => (prev === app.id ? null : app.id))
                      }
                    >
                      Schedule Screening
                    </button>
                    {screeningIds[app.id] && (
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        onClick={() =>
                          setFeedbackCandidateId((prev) => (prev === app.id ? null : app.id))
                        }
                      >
                        Submit Results
                      </button>
                    )}
                  </div>

                  {expandedCandidateId === app.id && (
                    <div className="mt-3 grid gap-2 rounded border border-gray-100 bg-gray-50 p-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Type</label>
                        <input
                          type="text"
                          value={screeningDrafts[app.id]?.screeningType || "Interview"}
                          onChange={(e) =>
                            setScreeningDrafts((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], screeningType: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Scheduled Date</label>
                        <input
                          type="datetime-local"
                          value={screeningDrafts[app.id]?.scheduledDate || ""}
                          onChange={(e) =>
                            setScreeningDrafts((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], scheduledDate: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Interviewer</label>
                        <input
                          type="text"
                          value={screeningDrafts[app.id]?.interviewer || ""}
                          onChange={(e) =>
                            setScreeningDrafts((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], interviewer: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                        onClick={() => handleScheduleScreening(app.id)}
                      >
                        Save Screening
                      </button>
                    </div>
                  )}

                  {feedbackCandidateId === app.id && screeningIds[app.id] && (
                    <div className="mt-3 grid gap-2 rounded border border-gray-100 bg-gray-50 p-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Status</label>
                        <select
                          value={screeningResults[app.id]?.status || "Completed"}
                          onChange={(e) =>
                            setScreeningResults((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], status: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="NoShow">No Show</option>
                          <option value="Rescheduled">Rescheduled</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600">Technical</label>
                          <select
                            value={screeningResults[app.id]?.technicalSkillsRating || "Average"}
                            onChange={(e) =>
                              setScreeningResults((prev) => ({
                                ...prev,
                                [app.id]: { ...prev[app.id], technicalSkillsRating: e.target.value },
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                          >
                            <option value="Poor">Poor</option>
                            <option value="Fair">Fair</option>
                            <option value="Average">Average</option>
                            <option value="Good">Good</option>
                            <option value="Excellent">Excellent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600">Communication</label>
                          <select
                            value={screeningResults[app.id]?.communicationRating || "Average"}
                            onChange={(e) =>
                              setScreeningResults((prev) => ({
                                ...prev,
                                [app.id]: { ...prev[app.id], communicationRating: e.target.value },
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                          >
                            <option value="Poor">Poor</option>
                            <option value="Fair">Fair</option>
                            <option value="Average">Average</option>
                            <option value="Good">Good</option>
                            <option value="Excellent">Excellent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600">Cultural Fit</label>
                          <select
                            value={screeningResults[app.id]?.culturalFitRating || "Average"}
                            onChange={(e) =>
                              setScreeningResults((prev) => ({
                                ...prev,
                                [app.id]: { ...prev[app.id], culturalFitRating: e.target.value },
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                          >
                            <option value="Poor">Poor</option>
                            <option value="Fair">Fair</option>
                            <option value="Average">Average</option>
                            <option value="Good">Good</option>
                            <option value="Excellent">Excellent</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Overall Score</label>
                        <input
                          type="number"
                          value={screeningResults[app.id]?.overallScore || ""}
                          onChange={(e) =>
                            setScreeningResults((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], overallScore: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600">Comments</label>
                        <textarea
                          value={screeningResults[app.id]?.comments || ""}
                          onChange={(e) =>
                            setScreeningResults((prev) => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], comments: e.target.value },
                            }))
                          }
                          rows={2}
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-2 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white"
                        onClick={() => handleSubmitScreening(app.id)}
                      >
                        Submit Results
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
