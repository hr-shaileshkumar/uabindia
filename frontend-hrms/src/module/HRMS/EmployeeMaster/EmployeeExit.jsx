import React from 'react'
import { useParams } from 'react-router-dom'

export default function EmployeeExit(){
  const { id } = useParams()
  return (
    <div className="p-3">
      <h3 className="text-base font-semibold mb-3">Employee Exit</h3>
      <div className="premium-card">Manage exit process for <strong>{id}</strong> (placeholder)</div>
    </div>
  )
}
