/**
 * Workspace UI Kit & Design System
 * 
 * Clean, standard, and intuitive component exports for building enterprise UI pages.
 * Use these standard components and hooks across all domain modules.
 */

// Page Actions & Buttons
export {
  CreateButton,
  StandardCreateButton,
  ErpCreateButton,
  RefreshButton,
  ErpRefreshButton,
  ExportButton,
  ErpExportButton,
  FilterButton,
  ErpFilterButton,
  RowActions,
  TableRowActions,
  ErpRowActions,
  DrawerFooter,
  ErpDrawerFooter,
  SearchFilter,
  ErpSearchFilter,
  ApproveRejectButtons,
  ErpApproveRejectButtons,
  EmptyState,
  ErpEmptyState,
} from "./page-kit";

// Workspace Enterprise Tools
export {
  WorkspaceToolbar,
  type WorkspaceToolbarProps,
  type StatusFilterOption,
} from "./workspace-toolbar";

export {
  ColumnCustomizer,
  type ColumnItem,
} from "./column-customizer";

export {
  AdvancedFilterDrawer,
} from "./advanced-filter-drawer";

// Data Table & List View Engine
export {
  useErpListView as useWorkspaceListView,
  useErpListView as useDataTable,
  useErpListView as useListView,
  useErpListView,
  ErpListFilterBar as WorkspaceListFilterBar,
  ErpListFilterBar as ListFilterBar,
  ErpListFilterBar,
} from "./list-view";

export type { ErpListViewProps as WorkspaceListViewProps, ErpListViewProps as ListViewProps, ErpListViewProps } from "./list-view";

// Floating Bulk Selection Bar
export {
  ErpFloatingBulkBar as FloatingBulkBar,
  ErpFloatingBulkBar,
} from "./floating-bulk-bar";

// Tabs & Panels
export {
  TabBar,
  TabPanel,
  ErpTabBar,
  ErpTabPanel,
} from "./tab-bar";
export type { TabItem, ErpTabItem } from "./tab-bar";

// Global Design System & Utility Styles
export {
  buttonClassName as buttonStyles,
  buttonClassName,
  erpButtonClassName,
  formInputClassName as inputStyles,
  formInputClassName,
  erpFormInputClassName,
  formLabelClassName as labelStyles,
  formLabelClassName,
  erpFormLabelClassName,
  panelClassName as panelStyles,
  panelClassName,
  erpPanelClassName,
  panelHeaderClassName,
  erpPanelHeaderClassName,
  panelTitleClassName,
  erpPanelTitleClassName,
  panelBodyClassName,
  erpPanelBodyClassName,
  statusBadgeTone as statusBadgeTones,
  statusBadgeTone,
  erpStatusBadgeTone,
  tableRowHoverClassName,
  erpTableRowHoverClassName,
  tableTdClassName,
  erpTableTdClassName,
  tableThClassName,
  erpTableThClassName,
  tableWrapClassName,
  erpTableWrapClassName,
} from "./styles";

// CRUD Header, KPI Stats, and Container Cards
export {
  CrudCard as WorkspaceCard,
  CrudCard,
  CrudHeaderStats as WorkspaceHeaderStats,
  CrudHeaderStats,
} from "./crud-workspace";

// Modals & Delete Confirmation Dialog
export {
  UniversalDeleteDialog as DeleteConfirmDialog,
  UniversalDeleteDialog,
} from "./templates/UniversalDeleteDialog";

// Dynamic Custom Attributes & Form Fields
export {
  DynamicCustomFieldsForm as CustomFieldsForm,
  DynamicCustomFieldsForm,
} from "./DynamicCustomFieldsForm";

// Bulk Data Import Wizard
export {
  BulkImportModal,
  type ImportColumnDefinition,
} from "./BulkImportModal";

// Commercial Printable Document PDF Engine
export {
  PrintableDocumentModal,
  type PrintableDocumentData,
  type DocumentLineItem,
} from "./PrintableDocumentModal";

// Excel-Style Keyboard Navigation
export {
  useTableKeyboardNav,
  type TableKeyboardNavOptions,
} from "./useTableKeyboardNav";

// Global Search & Palette
export { GlobalSearchCommand } from "./global-search-command";

// Module Hub & Overview Pages
export { ModuleHubPage } from "./module-hub-page";

// Quick Copy Tool
export { QuickCopyButton } from "./quick-copy";

