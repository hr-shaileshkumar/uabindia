import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteEmployee } from '../../../api/employees'

export default function EmployeeDelete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteEmployee(id)
      navigate('/module/hrms/employee-master')
    } catch (error) {
      console.error('Failed to delete employee', error)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Delete Employee</h2>
        <p className="mt-3 text-sm text-slate-600">
          This will soft delete the selected employee record from the active HRMS list.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
