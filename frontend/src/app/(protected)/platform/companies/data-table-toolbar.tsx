"use client";

import { Table } from "@tanstack/react-table"
import { Search, Plus, Trash2, Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { erpButtonClassName } from "@/components/erp/erpStyles"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey: string
  isSuperAdmin?: boolean
  showDeleted?: boolean
  onToggleDeleted?: () => void
  onCreate?: () => void
  onBulkDelete?: () => void
  onExport?: () => void
  onImport?: () => void
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  isSuperAdmin,
  showDeleted,
  onToggleDeleted,
  onCreate,
  onBulkDelete,
  onExport,
  onImport,
}: DataTableToolbarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-[150px] lg:w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="pl-8 bg-background border-border"
          />
        </div>
        
        {selectedCount > 0 && onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9 px-2 lg:px-3"
            onClick={onBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal bg-white/20 hover:bg-white/30 text-white border-transparent">
              {selectedCount}
            </Badge>
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {isSuperAdmin && onToggleDeleted && (
          <Button
            variant={showDeleted ? "secondary" : "outline"}
            size="sm"
            className="h-9"
            onClick={onToggleDeleted}
          >
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-9 hidden md:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport} className="h-9 hidden md:flex">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
        {onCreate && (
          <Button onClick={onCreate} size="sm" className={`${erpButtonClassName.primary} h-9`}>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        )}
      </div>
    </div>
  )
}
