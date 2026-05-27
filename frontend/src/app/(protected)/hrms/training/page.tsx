'use client';

import React, { useCallback, useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { useAuth } from '@/context/AuthContext';
import { useTraining } from '@/hooks/useHrmsApi';
import { notifyError } from '@/lib/notifications';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function TrainingPage() {
  const { user } = useAuth();
  const {
    getTrainingPrograms,
    createTrainingProgram,
    getEnrollments,
    enrollEmployee,
    getCertifications,
    getAssessmentsByEnrollment,
    loading,
    error,
  } = useTraining();

  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    programName: '',
    description: '',
    category: 'Technical',
    level: 'Beginner',
    duration: 0,
    provider: '',
    deliveryMode: 'Online',
    location: '',
    cost: 0,
    startDate: '',
    endDate: '',
    maxEnrollments: 30,
  });

  const loadData = useCallback(async () => {
    try {
      const [programsData, enrollmentsData] = await Promise.all([
        getTrainingPrograms(),
        user?.id ? getEnrollments(user.id) : Promise.resolve([]),
      ]);
      const certificateData = user?.id ? await getCertifications(user.id) : [];
      setPrograms(programsData || []);
      setEnrollments(enrollmentsData || []);
      setCertificates(certificateData || []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load training data.'), 'Training');
    }
  }, [getTrainingPrograms, getEnrollments, getCertifications, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrainingProgram(formData);
      setFormData({
        programName: '',
        description: '',
        category: 'Technical',
        level: 'Beginner',
        duration: 0,
        provider: '',
        deliveryMode: 'Online',
        location: '',
        cost: 0,
        startDate: '',
        endDate: '',
        maxEnrollments: 30,
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to create training program.'), 'New Program');
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;
    try {
      await enrollEmployee(courseId, user.id);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to enroll employee.'), 'Enrollment');
    }
  };

  const handleLoadAssessments = async (enrollmentId: string) => {
    try {
      const data = await getAssessmentsByEnrollment(enrollmentId);
      setAssessments((prev) => ({
        ...prev,
        [enrollmentId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to load assessments.'), 'Assessments');
    }
  };

  const loadedAssessments = Object.values(assessments).reduce((count, entries) => count + entries.length, 0);

  return (
    <StandardPageLayout
      title="Training & Development"
      subtitle="Manage programs, enrollments, assessments, and certifications in a structured learning-operations workspace."
      eyebrow="HRMS / Learning & Development"
      icon="training"
      actions={
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="erp-action-btn erp-action-btn-primary"
        >
          {showForm ? 'Close Program Form' : 'Create Program'}
        </button>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Programs</p>
          <p className="erp-kpi-value">{programs.length}</p>
          <p className="erp-kpi-meta">Learning content currently available in the catalog.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Enrollments</p>
          <p className="erp-kpi-value">{enrollments.length}</p>
          <p className="erp-kpi-meta">Current employee learning registrations for the signed-in user.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Certificates</p>
          <p className="erp-kpi-value erp-kpi-value-success">{certificates.length}</p>
          <p className="erp-kpi-meta">Completed achievements and awarded learning credentials.</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Assessments loaded</p>
          <p className="erp-kpi-value">{loadedAssessments}</p>
          <p className="erp-kpi-meta">Assessment records pulled into the current workspace.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Training Program</h2>
              <p className="mt-1 text-sm text-slate-500">Define curriculum, delivery model, instructor, and scheduling with the same enterprise form standard used across HRMS.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="erp-label">Program Name</label>
              <input
                type="text"
                value={formData.programName}
                onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                required
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="erp-input"
              />
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="erp-select"
                >
                  <option>Technical</option>
                  <option>Soft Skills</option>
                  <option>Management</option>
                  <option>Compliance</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="erp-label">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="erp-select"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Duration (hours)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="1"
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Delivery Mode</label>
                <select
                  value={formData.deliveryMode}
                  onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}
                  className="erp-select"
                >
                  <option>Online</option>
                  <option>Classroom</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Instructor</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">Cost</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) })}
                  min="0"
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-grid erp-form-grid-2">
              <div>
                <label className="erp-label">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Max Enrollments</label>
                <input
                  type="number"
                  value={formData.maxEnrollments}
                  onChange={(e) => setFormData({ ...formData, maxEnrollments: parseInt(e.target.value) })}
                  min="1"
                  className="erp-input"
                />
              </div>
            </div>
            <div className="erp-form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="erp-action-btn erp-action-btn-primary"
              >
                {loading ? 'Creating...' : 'Create Program'}
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
              <h2 className="erp-panel-title">Programs</h2>
              <p className="mt-1 text-sm text-slate-500">Browse available learning modules and trigger employee enrollment from the catalog.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          {programs.length === 0 ? (
            <div className="erp-empty">No programs found.</div>
          ) : (
            <div className="erp-record-grid">
              {programs.map((program: any) => (
                <div key={program.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{program.title || 'Training Program'}</div>
                      <div className="erp-record-meta">{program.category} • {program.deliveryMode || program.level || ''}</div>
                    </div>
                    <span className="erp-chip erp-chip-info">{program.level || 'Learning'}</span>
                  </div>
                  {user?.id && (
                    <button
                      type="button"
                      onClick={() => handleEnroll(program.id)}
                      className="erp-action-btn erp-action-btn-primary mt-4"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Enrollments</h2>
              <p className="mt-1 text-sm text-slate-500">Inspect current enrollment status and drill into assessment outcomes for each learning activity.</p>
            </div>
          </div>
          <div className="erp-panel-body">
          {enrollments.length === 0 ? (
            <div className="erp-empty">No enrollments found.</div>
          ) : (
            <div className="erp-record-grid">
              {enrollments.map((enrollment: any) => {
                const program = programs.find((item: any) => item.id === enrollment.courseId);
                const programTitle = program?.title || enrollment.courseId || "Course";
                return (
                <div key={enrollment.id} className="erp-record-card">
                  <div className="erp-record-header">
                    <div>
                      <div className="erp-record-title">{programTitle}</div>
                      <div className="erp-record-meta">Enrollment progress and assessment visibility</div>
                    </div>
                    <span className="erp-chip erp-chip-info">{enrollment.status || 'Active'}</span>
                  </div>
                    <button
                      type="button"
                      onClick={() => handleLoadAssessments(enrollment.id)}
                      className="erp-action-btn erp-action-btn-secondary mt-4"
                    >
                      Load Assessments
                    </button>
                    {assessments[enrollment.id]?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {assessments[enrollment.id].map((assessment: any) => (
                          <li key={assessment.id}>
                            {assessment.title} - {assessment.result}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                </div>
              );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Certificates</h2>
            <p className="mt-1 text-sm text-slate-500">Issued certifications and digital credentials available to the employee.</p>
          </div>
        </div>
        <div className="erp-panel-body">
        {certificates.length === 0 ? (
          <div className="erp-empty">No certificates found.</div>
        ) : (
          <div className="erp-record-grid erp-record-grid-three">
            {certificates.map((certificate: any) => (
              <div key={certificate.id} className="erp-record-card">
                <div className="erp-record-title">{certificate.title || 'Certificate'}</div>
                <div className="erp-record-meta">{certificate.certificateNumber}</div>
                {certificate.digitalCertificateUrl && (
                  <a
                    className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
                    href={certificate.digitalCertificateUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </StandardPageLayout>
  );
}
