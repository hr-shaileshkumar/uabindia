import api from './axios'

export async function listUsers() {
  const resp = await api.get('/users')
  return resp.data
}

export async function createUser(payload) {
  const resp = await api.post('/users', payload, {
    successMessage: 'User created successfully',
  })
  return resp.data
}

export async function updateUser(id, payload) {
  const resp = await api.put(`/users/${id}`, payload, {
    successMessage: 'User updated successfully',
  })
  return resp.data
}

export async function deleteUser(id) {
  const resp = await api.delete(`/users/${id}`, {
    successMessage: 'User deleted successfully',
  })
  return resp.data
}

export async function resetUserPassword(id, newPassword) {
  const resp = await api.post(`/users/${id}/reset-password`, { newPassword }, {
    successMessage: 'Password reset successfully',
  })
  return resp.data
}

export async function updateUserAccess(id, allowedPages) {
  const resp = await api.put(`/users/${id}/access`, allowedPages, {
    successMessage: 'User page access updated successfully',
  })
  return resp.data
}

export default {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateUserAccess,
}
