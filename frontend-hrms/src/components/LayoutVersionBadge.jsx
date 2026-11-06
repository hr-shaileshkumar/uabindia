import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

/**
 * Standardized Database-Driven UI Layout Version Badge
 * Explicitly displays page schema version linked to Form Studio
 */
export default function LayoutVersionBadge({ entity = '', version = 1.0, className = '' }) {
  const numVersion = Number(version ?? 1.0)
  const formattedVersion = isNaN(numVersion) || numVersion <= 0 ? '1.0' : numVersion.toFixed(1)

  const studioLink = entity
    ? `/administration/form-studio?entity=${encodeURIComponent(entity)}`
    : '/administration/form-studio'

  return (
    <Link
      to={studioLink}
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition px-2.5 py-1 text-[11px] font-bold text-blue-800 border border-blue-200 cursor-pointer shadow-2xs mr-1 ${className}`}
      title={`Database layout schema v${formattedVersion} • Click to configure in Form Studio`}
    >
      <Sparkles size={12} className="text-blue-600 shrink-0" />
      <span>Layout v{formattedVersion} • Form Studio</span>
    </Link>
  )
}

