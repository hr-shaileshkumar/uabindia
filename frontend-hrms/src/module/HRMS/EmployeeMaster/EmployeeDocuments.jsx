import React from 'react'
import { useParams } from 'react-router-dom'

export default function EmployeeDocuments(){
  const { id } = useParams()
  return (
    <div className="p-3">
      <h3 className="text-base font-semibold mb-3">Employee Documents</h3>
      <div className="premium-card">Documents management for <strong>{id}</strong> (placeholder)</div>
    </div>
  )
}
