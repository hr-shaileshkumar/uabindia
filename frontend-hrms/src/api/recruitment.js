import api from './axios'

// 1. Manpower Planning
export async function getManpowerPlans(filtersOrYear, companyId, projectId) {
  let params = {}
  if (typeof filtersOrYear === 'object' && filtersOrYear !== null) {
    params = { ...filtersOrYear }
  } else {
    if (filtersOrYear && filtersOrYear !== 'All') params.fiscalYear = filtersOrYear
    if (companyId) params.companyId = companyId
    if (projectId) params.projectId = projectId
  }
  const resp = await api.get('/recruitment/manpower-plans', { params })
  return resp.data || []
}

export async function createManpowerPlan(payload) {
  const resp = await api.post('/recruitment/manpower-plans', payload)
  return resp.data
}

export async function deleteManpowerPlan(id) {
  const resp = await api.delete(`/recruitment/manpower-plans/${id}`)
  return resp.data
}

// 2. Job Postings
export async function getJobs(status) {
  const resp = await api.get('/recruitment/jobs', { params: { status } })
  return resp.data || []
}

export async function createJob(payload) {
  const resp = await api.post('/recruitment/jobs', payload)
  return resp.data
}

export async function toggleJobPortalPublish(id) {
  const resp = await api.put(`/recruitment/jobs/${id}/publish`)
  return resp.data
}

// 3. Candidates ATS & Automated Onboarding
export async function getCandidates(jobId, stage) {
  const resp = await api.get('/recruitment/candidates', { params: { jobId, stage } })
  return resp.data || []
}

export async function addCandidate(payload) {
  const resp = await api.post('/recruitment/candidates', payload)
  return resp.data
}

export async function updateCandidateStage(id, stage, notes) {
  const resp = await api.put(`/recruitment/candidates/${id}/stage`, { stage, notes })
  return resp.data
}

export async function convertCandidateToEmployee(id, payload = {}) {
  const resp = await api.post(`/recruitment/candidates/${id}/convert-to-employee`, payload)
  return resp.data
}
