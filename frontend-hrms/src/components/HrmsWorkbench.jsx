import React from 'react'
import { Link } from 'react-router-dom'

export default function HrmsWorkbench({ title, description, stats = [], actions = [], notes = [] }) {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-800">{stat.value}</div>
              {stat.help && <div className="mt-1 text-xs text-slate-500">{stat.help}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Recommended Actions</h3>
          <div className="mt-4 grid gap-3">
            {actions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-900"
              >
                <span>{action.label}</span>
                <span className="text-xs text-slate-400">{action.meta || 'Open'}</span>
              </Link>
            ))}
            {actions.length === 0 && <div className="text-sm text-slate-500">No linked actions yet.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Module Notes</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {notes.map((note) => (
              <li key={note} className="rounded-lg bg-slate-50 px-3 py-2">{note}</li>
            ))}
            {notes.length === 0 && <li className="text-slate-500">No notes available.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
