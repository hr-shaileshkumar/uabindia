'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useRecruitment } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

const getApplicationChipClass = (status: string) => {
  switch (status) {
    case 'Joined':
    case 'OfferAccepted':
      return 'erp-chip erp-chip-success';
    case 'InterviewInvited':
    case 'InterviewScheduled':
    case 'InterviewCompleted':
    case 'RoundTwo':
    case 'FinalRound':
      return 'erp-chip erp-chip-info';
    case 'OfferExtended':
    case 'ScreeningInProgress':
      return 'erp-chip erp-chip-warning';
    case 'Rejected':
    case 'WithdrawnByCandidate':
      return 'erp-chip erp-chip-danger';
    default:
      return 'erp-chip erp-chip-neutral';
  }
};

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
      notifyError(getApiErrorMessage(err, 'Failed to load job postings.'), 'Recruitment');
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
      notifyError(getApiErrorMessage(err, 'Failed to load applications.'), 'Applications');
    }
  };

  const handleStatusChange = async (candidateId: string, status: string) => {
    try {
      await updateApplicationStatus(candidateId, status);
      setApplications((prev: any[]) =>
        prev.map((app) => (app.id === candidateId ? { ...app, status } : app))
      );
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to update application status.'), 'Application Status');
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
      notifyError(getApiErrorMessage(err, 'Failed to schedule screening.'), 'Interview Screening');
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
      notifyError(getApiErrorMessage(err, 'Failed to submit screening feedback.'), 'Screening Feedback');
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
      notifyError(getApiErrorMessage(err, 'Failed to create job posting.'), 'New Job');
    }
  };

  const interviewPipelineCount = applications.filter((app: any) =>
    ['InterviewInvited', 'InterviewScheduled', 'InterviewCompleted', 'RoundTwo', 'FinalRound'].includes(app.status)
  ).length;
  const offerCount = applications.filter((app: any) =>
    ['OfferExtended', 'OfferAccepted', 'Joined'].includes(app.status)
  ).length;

  const selectedJob = jobs.find((job: any) => job.id === selectedJobId);

  return (
    <StandardPageLayout
      title="Recruitment Management"
      subtitle="Coordinate open roles, application progression, interview scheduling, and screening feedback through a unified talent workbench."
      eyebrow="HRMS / Talent Acquisition"
      icon="employees"
      actions={
        <button
          type="button"
          onClick={() => setShowJobForm((prev) => !prev)}
          className="erp-action-btn erp-action-btn-primary"
        >
          {showJobForm ? 'Close Job Form' : 'Post New Job'}
        </button>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Open roles</p>
          <p className="erp-kpi-value">{jobs.length}</p>
          <p className="erp-kpi-meta">Current job postings available for recruitment activity.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Applications</p>
          <p className="erp-kpi-value">{applications.length}</p>
          <p className="erp-kpi-meta">Candidate records for the selected requisition.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Interview pipeline</p>
          <p className="erp-kpi-value">{interviewPipelineCount}</p>
          <p className="erp-kpi-meta">Profiles moving through interview and advanced screening stages.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Offers / joins</p>
          <p className="erp-kpi-value erp-kpi-value-success">{offerCount}</p>
          <p className="erp-kpi-meta">Candidates nearing closure or fully onboarded.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showJobForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Job Posting</h2>
              <p className="mt-1 text-sm text-slate-500">Define requisition details, commercial range, and hiring timeline with the standard talent-acquisition form.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div>
              <label className="erp-label">Job Title</label>
              <input
                type="text"
                value={jobForm.jobTitle}
                onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                required
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Job Description</label>
              <textarea
                value={jobForm.jobDescription}
                onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })}
                required
                rows={4}
                className="erp-input"
              />
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Department</label>
                <input
                  type="text"
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Location</label>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  required
                  className="erp-input"
                />
              </div>
            </div>

            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Job Level</label>
                <select
                  value={jobForm.level}
                  onChange={(e) => setJobForm({ ...jobForm, level: e.target.value })}
                  className="erp-select"
                >
                  <option value="EntryLevel">Entry Level</option>
                  <option value="MidLevel">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="erp-label">Job Type</label>
                <select
                  value={jobForm.jobType}
                  onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                  className="erp-select"
                >
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Positions</label>
                <input
                  type="number"
                  value={jobForm.numberOfPositions}
                  onChange={(e) => setJobForm({ ...jobForm, numberOfPositions: parseInt(e.target.value) })}
                  min="1"
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Min Salary</label>
                <input
                  type="number"
                  value={jobForm.minSalary}
                  onChange={(e) => setJobForm({ ...jobForm, minSalary: parseInt(e.target.value) })}
                  className="erp-input"
                />
              </div>
            </div>
            <div>
              <label className="erp-label">Max Salary</label>
              <input
                type="number"
                value={jobForm.maxSalary}
                onChange={(e) => setJobForm({ ...jobForm, maxSalary: parseInt(e.target.value) })}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Skills (Required)</label>
              <input
                type="text"
                value={jobForm.requiredSkills}
                onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Skills (Nice to Have)</label>
              <input
                type="text"
                value={jobForm.niceToHaveSkills}
                onChange={(e) => setJobForm({ ...jobForm, niceToHaveSkills: e.target.value })}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Closing Date</label>
              <input
                type="date"
                value={jobForm.closingDate}
                onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                className="erp-input"
              />
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowJobForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="erp-action-btn erp-action-btn-primary"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      <div className="erp-section-grid erp-section-grid-two">
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Job Postings</h2>
              <p className="mt-1 text-sm text-slate-500">Manage role definitions, requisition details, and target requisition selection.</p>
            </div>
          </div>
          <div className="erp-panel-body space-y-4">
          {jobs.length > 0 && (
            <div className="mb-4">
              <label className="erp-label">Select Job</label>
              <select
                value={selectedJobId || ''}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="erp-select"
              >
                {jobs.map((job: any) => (
                  <option key={job.id} value={job.id}>
                    {job.title || 'Job Posting'}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedJob ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              Working on <span className="font-semibold text-slate-900">{selectedJob.title || 'Selected role'}</span>
            </div>
          ) : null}
          {jobs.length === 0 ? (
            <div className="erp-empty">No job postings.</div>
          ) : (
            <div className="erp-record-grid">
              {jobs.map((job: any) => (
                <div key={job.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{job.title || 'Job Posting'}</div>
                      <div className="erp-record-meta">{job.department || 'Department'} • {job.location || 'Location'}</div>
                    </div>
                    <span className="erp-chip erp-chip-info">Open Role</span>
                  </div>
                  <div className="erp-record-body">
                    <div className="erp-metric-list">
                      <div className="erp-metric-row">
                        <span className="erp-metric-label">Level</span>
                        <span className="erp-metric-value">{job.level || 'MidLevel'}</span>
                      </div>
                      <div className="erp-metric-row">
                        <span className="erp-metric-label">Type</span>
                        <span className="erp-metric-value">{job.jobType || 'FullTime'}</span>
                      </div>
                      <div className="erp-metric-row">
                        <span className="erp-metric-label">Positions</span>
                        <span className="erp-metric-value">{job.numberOfPositions || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Applications</h2>
              <p className="mt-1 text-sm text-slate-500">Advance shortlisted candidates, schedule screenings, and capture feedback in-line.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          {applications.length === 0 ? (
            <div className="erp-empty">No applications.</div>
          ) : (
            <div className="erp-record-grid">
              {applications.map((app: any) => (
                <div key={app.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{`${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Candidate'}</div>
                      <div className="erp-record-meta">Candidate pipeline item for the selected role</div>
                    </div>
                    <span className={getApplicationChipClass(app.status)}>{app.status || 'Applied'}</span>
                  </div>
                  <div className="erp-record-body">
                    <div className="erp-form-grid erp-form-grid-2 items-end">
                      <div>
                        <label className="erp-label">Application Status</label>
                        <select
                          className="erp-select"
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
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        Screening record {screeningIds[app.id] ? 'available' : 'not yet created'}.
                      </div>
                    </div>
                    <div className="erp-record-actions">
                      <button
                        type="button"
                        className="erp-action-btn erp-action-btn-secondary"
                        onClick={() =>
                          setExpandedCandidateId((prev) => (prev === app.id ? null : app.id))
                        }
                      >
                        Schedule Screening
                      </button>
                      {screeningIds[app.id] && (
                        <button
                          type="button"
                          className="erp-action-btn erp-action-btn-secondary"
                          onClick={() =>
                            setFeedbackCandidateId((prev) => (prev === app.id ? null : app.id))
                          }
                        >
                          Submit Results
                        </button>
                      )}
                    </div>

                    {expandedCandidateId === app.id && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="mb-3 text-sm font-semibold text-slate-900">Schedule Screening</div>
                        <div className="erp-subgrid">
                          <div>
                            <label className="erp-label">Type</label>
                            <input
                              type="text"
                              value={screeningDrafts[app.id]?.screeningType || 'Interview'}
                              onChange={(e) =>
                                setScreeningDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], screeningType: e.target.value },
                                }))
                              }
                              className="erp-input"
                            />
                          </div>
                          <div>
                            <label className="erp-label">Scheduled Date</label>
                            <input
                              type="datetime-local"
                              value={screeningDrafts[app.id]?.scheduledDate || ''}
                              onChange={(e) =>
                                setScreeningDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], scheduledDate: e.target.value },
                                }))
                              }
                              className="erp-input"
                            />
                          </div>
                          <div>
                            <label className="erp-label">Interviewer</label>
                            <input
                              type="text"
                              value={screeningDrafts[app.id]?.interviewer || ''}
                              onChange={(e) =>
                                setScreeningDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], interviewer: e.target.value },
                                }))
                              }
                              className="erp-input"
                            />
                          </div>
                          <button
                            type="button"
                            className="erp-action-btn erp-action-btn-primary"
                            onClick={() => handleScheduleScreening(app.id)}
                          >
                            Save Screening
                          </button>
                        </div>
                      </div>
                    )}

                    {feedbackCandidateId === app.id && screeningIds[app.id] && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="mb-3 text-sm font-semibold text-slate-900">Submit Screening Results</div>
                        <div className="erp-subgrid">
                          <div>
                            <label className="erp-label">Status</label>
                            <select
                              value={screeningResults[app.id]?.status || 'Completed'}
                              onChange={(e) =>
                                setScreeningResults((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], status: e.target.value },
                                }))
                              }
                              className="erp-select"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Completed">Completed</option>
                              <option value="NoShow">No Show</option>
                              <option value="Rescheduled">Rescheduled</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="erp-form-grid erp-form-grid-3">
                            <div>
                              <label className="erp-label">Technical</label>
                              <select
                                value={screeningResults[app.id]?.technicalSkillsRating || 'Average'}
                                onChange={(e) =>
                                  setScreeningResults((prev) => ({
                                    ...prev,
                                    [app.id]: { ...prev[app.id], technicalSkillsRating: e.target.value },
                                  }))
                                }
                                className="erp-select"
                              >
                                <option value="Poor">Poor</option>
                                <option value="Fair">Fair</option>
                                <option value="Average">Average</option>
                                <option value="Good">Good</option>
                                <option value="Excellent">Excellent</option>
                              </select>
                            </div>
                            <div>
                              <label className="erp-label">Communication</label>
                              <select
                                value={screeningResults[app.id]?.communicationRating || 'Average'}
                                onChange={(e) =>
                                  setScreeningResults((prev) => ({
                                    ...prev,
                                    [app.id]: { ...prev[app.id], communicationRating: e.target.value },
                                  }))
                                }
                                className="erp-select"
                              >
                                <option value="Poor">Poor</option>
                                <option value="Fair">Fair</option>
                                <option value="Average">Average</option>
                                <option value="Good">Good</option>
                                <option value="Excellent">Excellent</option>
                              </select>
                            </div>
                            <div>
                              <label className="erp-label">Cultural Fit</label>
                              <select
                                value={screeningResults[app.id]?.culturalFitRating || 'Average'}
                                onChange={(e) =>
                                  setScreeningResults((prev) => ({
                                    ...prev,
                                    [app.id]: { ...prev[app.id], culturalFitRating: e.target.value },
                                  }))
                                }
                                className="erp-select"
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
                            <label className="erp-label">Overall Score</label>
                            <input
                              type="number"
                              value={screeningResults[app.id]?.overallScore || ''}
                              onChange={(e) =>
                                setScreeningResults((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], overallScore: e.target.value },
                                }))
                              }
                              className="erp-input"
                            />
                          </div>
                          <div>
                            <label className="erp-label">Comments</label>
                            <textarea
                              value={screeningResults[app.id]?.comments || ''}
                              onChange={(e) =>
                                setScreeningResults((prev) => ({
                                  ...prev,
                                  [app.id]: { ...prev[app.id], comments: e.target.value },
                                }))
                              }
                              rows={2}
                              className="erp-input"
                            />
                          </div>
                          <button
                            type="button"
                            className="erp-action-btn erp-action-btn-primary"
                            onClick={() => handleSubmitScreening(app.id)}
                          >
                            Submit Results
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
