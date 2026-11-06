import api from './axios'

// 1. Transfers
export async function getTransfers(status) {
  const resp = await api.get('/workforce-movement/transfers', { params: { status } })
  return resp.data || []
}

export async function createTransfer(payload) {
  const resp = await api.post('/workforce-movement/transfers', payload)
  return resp.data
}

export async function approveTransfer(id, approvedBy = 'HR Operations Director') {
  const resp = await api.put(`/workforce-movement/transfers/${id}/approve`, { approvedBy })
  return resp.data
}

// 2. Promotions
export async function getPromotions(status) {
  const resp = await api.get('/workforce-movement/promotions', { params: { status } })
  return resp.data || []
}

export async function createPromotion(payload) {
  const resp = await api.post('/workforce-movement/promotions', payload)
  return resp.data
}

export async function approvePromotion(id, approvedBy = 'Executive HR Committee') {
  const resp = await api.put(`/workforce-movement/promotions/${id}/approve`, { approvedBy })
  return resp.data
}
