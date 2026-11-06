import { useCallback, useEffect, useState } from 'react'
import { getPreviewSequence } from '../api/sequences'

export function useAutoSequence(entityName, companyId, initialFallback = '') {
  const [code, setCode] = useState(initialFallback)
  const [loading, setLoading] = useState(false)

  const fetchSequence = useCallback(async () => {
    if (!entityName) return
    setLoading(true)
    try {
      const res = await getPreviewSequence(entityName, companyId)
      if (res?.code) {
        setCode(res.code)
      }
    } catch {
      // If preview call fails, fallback to standard pattern
      if (!code) {
        const prefix = entityName.length >= 3 ? entityName.slice(0, 3).toUpperCase() : 'MAS'
        setCode(`${prefix}-001`)
      }
    } finally {
      setLoading(false)
    }
  }, [entityName, companyId])

  useEffect(() => {
    fetchSequence()
  }, [fetchSequence])

  return {
    code,
    setCode,
    regenerate: fetchSequence,
    loading,
  }
}

export default useAutoSequence
