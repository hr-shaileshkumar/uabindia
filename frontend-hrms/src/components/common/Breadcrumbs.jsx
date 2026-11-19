import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === "dashboard") {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const formatted = value
          .replace(/-/g, " ")
          .replace(/^./, (str) => str.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{formatted}</span>
            ) : (
              <Link to={to} className="hover:text-indigo-600 transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
