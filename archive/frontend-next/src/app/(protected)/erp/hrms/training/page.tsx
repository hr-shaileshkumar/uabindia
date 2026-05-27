'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTraining } from '@/lib/api-hooks-part1';

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
      console.error('Failed to load data:', err);
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
      console.error('Failed to create program:', err);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;
    try {
      await enrollEmployee(courseId, user.id);
      loadData();
    } catch (err) {
      console.error('Failed to enroll:', err);
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
      console.error('Failed to load assessments:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Training & Development</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Program
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Error: {error}
        </div>
      )}

      {showForm && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create Training Program</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Program Name</label>
              <input
                type="text"
                value={formData.programName}
                onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Technical</option>
                  <option>Soft Skills</option>
                  <option>Management</option>
                  <option>Compliance</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Mode</label>
                <select
                  value={formData.deliveryMode}
                  onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Online</option>
                  <option>Classroom</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Instructor</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cost</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Enrollments</label>
                <input
                  type="number"
                  value={formData.maxEnrollments}
                  onChange={(e) => setFormData({ ...formData, maxEnrollments: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Programs</h2>
          {programs.length === 0 ? (
            <div className="text-sm text-gray-500">No programs found.</div>
          ) : (
            <div className="space-y-3">
              {programs.map((program: any) => (
                <div key={program.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{program.title || "Training Program"}</div>
                  <div className="text-xs text-gray-500">{program.category} • {program.deliveryMode || program.level || ""}</div>
                  {user?.id && (
                    <button
                      type="button"
                      onClick={() => handleEnroll(program.id)}
                      className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-xl font-semibold mb-4">Enrollments</h2>
          {enrollments.length === 0 ? (
            <div className="text-sm text-gray-500">No enrollments found.</div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment: any) => {
                const program = programs.find((item: any) => item.id === enrollment.courseId);
                const programTitle = program?.title || enrollment.courseId || "Course";
                return (
                <div key={enrollment.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{programTitle}</div>
                  <div className="text-xs text-gray-500">{enrollment.status}</div>
                    <button
                      type="button"
                      onClick={() => handleLoadAssessments(enrollment.id)}
                      className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      Load Assessments
                    </button>
                    {assessments[enrollment.id]?.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
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

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h2 className="text-xl font-semibold mb-4">Certificates</h2>
        {certificates.length === 0 ? (
          <div className="text-sm text-gray-500">No certificates found.</div>
        ) : (
          <div className="space-y-3">
            {certificates.map((certificate: any) => (
              <div key={certificate.id} className="p-3 border rounded-lg">
                <div className="font-medium">{certificate.title || "Certificate"}</div>
                <div className="text-xs text-gray-500">{certificate.certificateNumber}</div>
                {certificate.digitalCertificateUrl && (
                  <a
                    className="mt-2 inline-block text-xs text-blue-600 hover:underline"
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
  );
}
