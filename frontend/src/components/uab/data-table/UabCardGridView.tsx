"use client";

import React from "react";
import {
  MessageSquare,
  Heart,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRowFieldValue } from "@/lib/workspace/list-view";

export interface UabCardGridViewProps {
  rows: any[];
  titleKey?: string;
  subtitleKey?: string;
  idField?: string;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  favorites: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onOpenComments?: (row: any) => void;
  getRelativeTime?: (row: any) => string;
}

export type ErpCardGridViewProps = UabCardGridViewProps;

export function UabCardGridView({
  rows,
  titleKey = "name",
  subtitleKey = "designation",
  idField = "id",
  onEdit,
  onDelete,
  favorites,
  onToggleFavorite,
  onOpenComments,
  getRelativeTime,
}: ErpCardGridViewProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500">No records found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {rows.map((row, idx) => {
        const rowId = String(row[idField] || row.id || row.code || idx);
        const title = getRowFieldValue(row, titleKey) || row.fullName || row.name || row.title || row.label || "Untitled Record";
        const subtitle = getRowFieldValue(row, subtitleKey) || row.designation || row.role || row.department || row.project || "";
        const status = String(getRowFieldValue(row, "status") ?? (row.isActive === true ? "Active" : row.isActive === false ? "Inactive" : ""));
        const isActive = status.toLowerCase() === "active";
        const isFavorite = Boolean(favorites[rowId]);
        const relTime = getRelativeTime ? getRelativeTime(row) : `${(idx % 5) + 1} d`;
        const commentCount = row.commentCount ?? 0;
        const initials = String(title)
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "U";

        return (
          <div
            key={rowId}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
          >
            {/* Top header: Avatar, Title, Favorite Heart */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold text-sm dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {initials}
                    {status && (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                          isActive ? "bg-emerald-500" : "bg-slate-400"
                        )}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(row)}
                      className="text-left font-bold text-xs sm:text-sm text-[#8B1E28] hover:underline dark:text-rose-400 truncate block w-full cursor-pointer"
                    >
                      {title}
                    </button>
                    {subtitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={() => onToggleFavorite(rowId)}
                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                  title={isFavorite ? "Remove favorite" : "Mark as favorite"}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-300 dark:text-slate-600 hover:text-rose-500"
                    )}
                  />
                </button>
              </div>

              {/* Attributes Chips */}
              <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                {row.project && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{row.project}</span>
                  </div>
                )}
                {row.location && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{row.location}</span>
                  </div>
                )}
                {row.department && !row.project && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{row.department}</span>
                  </div>
                )}
                {row.dateOfJoining && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">Joined {row.dateOfJoining}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer: Relative Time, Comments, Edit/Delete */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>{relTime}</span>
                <button
                  type="button"
                  onClick={() => onOpenComments?.(row)}
                  className="flex items-center gap-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="View activity & comments"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>{commentCount}</span>
                </button>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    title="Edit record"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const ErpCardGridView = UabCardGridView;
