import api from './axios'

export const getCycles = async (params = {}) => {
  const resp = await api.get('/performance/cycles', { params })
  return resp.data
}

export const createCycle = async (payload) => {
  const resp = await api.post('/performance/cycles', payload, {
    successMessage: 'Appraisal cycle created successfully',
  })
  return resp.data
}

export const getAppraisals = async (params = {}) => {
  const resp = await api.get('/performance/appraisals', { params })
  return resp.data
}

export const submitSelfReview = async (appraisalId, payload) => {
  const resp = await api.post(`/performance/appraisals/${appraisalId}/self-review`, payload, {
    successMessage: 'Self review submitted successfully',
  })
  return resp.data
}

export const submitManagerReview = async (appraisalId, payload) => {
  const resp = await api.post(`/performance/appraisals/${appraisalId}/manager-review`, payload, {
    successMessage: 'Manager review completed successfully',
  })
  return resp.data
}
