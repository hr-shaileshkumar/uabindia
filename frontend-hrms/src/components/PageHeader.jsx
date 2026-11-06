import React from 'react'
import { Link } from 'react-router-dom'

export default function PageHeader({
  icon: Icon,
  title,
  badge,
  badgeTone = 'slate',
  description,
  actions,
  children,
  className = '',
}) {
  const badgeClasses = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[badgeTone] || 'bg-slate-100 text-slate-700 border-slate-200'

  const renderActions = () => {
    if (!actions) return null

    // If actions is an array of action config objects or elements
    if (Array.isArray(actions)) {
      return actions.map((action, index) => {
        if (!action) return null
        if (React.isValidElement(action)) {
          return <React.Fragment key={index}>{action}</React.Fragment>
        }
        if (action.to) {
          return (
            <Link
              key={action.to || index}
              to={action.to}
              className={`btn btn-sm ${action.variant || 'btn-primary'} text-xs py-1 px-3 gap-1.5`}
            >
              {action.icon}
              <span>{action.label}</span>
            </Link>
          )
        }
        return null
      })
    }

    // If actions is passed as a React element / JSX node (e.g. actions={<Link ... />})
    if (React.isValidElement(actions)) {
      return actions
    }

    return null
  }

  return (
    <div className={`border-b border-slate-200/80 pb-2.5 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100/70 text-purple-700 shadow-2xs shrink-0">
                <Icon size={17} />
              </span>
            )}
            <span>{title}</span>
          </h1>
          {badge && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 font-normal mt-1 leading-normal">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {renderActions()}
        {children}
      </div>
    </div>
  )
}
