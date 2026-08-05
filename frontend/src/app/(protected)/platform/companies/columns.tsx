"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2, RotateCcw, Eye, Building } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { CompanyRecord } from "@/features/companies/types"

interface CompanyColumnsProps {
  onEdit: (company: CompanyRecord) => void
  onQuickEdit: (company: CompanyRecord) => void
  onDelete: (company: CompanyRecord) => void
  onRestore: (company: CompanyRecord) => void
  isSuperAdmin: boolean
}

export const getColumns = ({
  onEdit,
  onQuickEdit,
  onDelete,
  onRestore,
  isSuperAdmin,
}: CompanyColumnsProps): ColumnDef<CompanyRecord>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Company Name",
    cell: ({ row }) => {
      const company = row.original
      const subtitle =
        company.legalName && company.legalName !== company.name
          ? company.legalName
          : company.code
            ? `Code: ${company.code}`
            : company.email || "Company Master Record"

      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Building className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{company.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "tenantId",
    header: "Tenant ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
        {row.getValue("tenantId") || "Global"}
      </span>
    ),
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
        {row.getValue("code") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.getValue("city") || "-"}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.getValue("email") || "-"}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const company = row.original
      if (company.isDeleted) {
        return <Badge variant="destructive">Deleted</Badge>
      }
      return company.isActive ? (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 shadow-none border-transparent">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-2">Actions</div>,
    cell: ({ row }) => {
      const company = row.original

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(company)}
            className="h-8 px-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!company.isDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(company)}>
                    <Eye className="mr-2 h-4 w-4 text-slate-500" />
                    View Details
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => onQuickEdit(company)}>
                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                        Quick Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => onDelete(company)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                        Delete Company
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                isSuperAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => onRestore(company)}>
                      <RotateCcw className="mr-2 h-4 w-4 text-emerald-500" />
                      Restore Company
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => onDelete(company)}>
                      <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                      Permanent Delete
                    </DropdownMenuItem>
                  </>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
