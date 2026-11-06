import React from 'react'
import { useParams } from 'react-router-dom'
import EmployeeForm from './EmployeeForm'

export default function EmployeeEdit() {
  const { id } = useParams()

  return <EmployeeForm initial={{ employeeId: id }} />
}
