import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="text-xl font-bold text-slate-900">HRMS Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The requested HRMS module or submodule could not be found or may have moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
      >
        <Home className="w-4 h-4" />
        Return to HR Cockpit
      </Link>
    </div>
  );
};

export default NotFound;
