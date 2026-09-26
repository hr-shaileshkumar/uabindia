import { PageSchema } from "../types";

export const manufacturingSchemas: Record<string, PageSchema> = {
  "manufacturing.work-orders": {
    pageKey: "manufacturing.work-orders",
    title: "Production Work Orders",
    subTitle: "Manufacturing shop floor job cards, BOM consumption, and completion stages.",
    entityName: "WorkOrder",
    moduleKey: "manufacturing",
    viewType: "table",
    apiEndpoint: "/manufacturing/work-orders",
    icon: "Cpu",
    requiredPermission: "manufacturing.orders.read",
    columns: [
      { key: "workOrderNumber", label: "Work Order #", width: 140 },
      { key: "itemName", label: "Finished Good", width: 220 },
      { key: "plannedQuantity", label: "Planned Qty", type: "number", width: 120 },
      { key: "completedQuantity", label: "Completed", type: "number", width: 120 },
      { key: "startDate", label: "Start Date", type: "date", width: 120 },
      { key: "dueDate", label: "Due Date", type: "date", width: 120 },
      { key: "status", label: "Status", type: "badge", width: 120 },
    ],
    filters: [
      { key: "search", label: "Search work order or item", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Draft", label: "Draft" },
          { value: "InProgress", label: "In Progress" },
          { value: "Completed", label: "Completed" },
          { value: "Cancelled", label: "Cancelled" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "job",
          label: "Work Order Specification",
          fields: [
            { key: "itemId", label: "Finished Product", type: "lookup", lookupEndpoint: "/inventory/items", required: true, span: 2 },
            { key: "plannedQuantity", label: "Planned Quantity", type: "number", required: true, span: 1 },
            { key: "startDate", label: "Planned Start", type: "date", required: true, span: 1 },
            { key: "dueDate", label: "Due Date", type: "date", required: true, span: 1 },
            { key: "notes", label: "Job Instructions", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Create Work Order", variant: "primary", icon: "Plus" },
      { key: "complete", label: "Mark Completed", variant: "success", icon: "CheckCircle2" },
    ],
  },
};

export const projectSchemas: Record<string, PageSchema> = {
  "projects.list": {
    pageKey: "projects.list",
    title: "Projects & Engagements",
    subTitle: "Client projects, operational milestones, budget consumption, and resource allocations.",
    entityName: "Project",
    moduleKey: "projects",
    viewType: "table",
    apiEndpoint: "/projects",
    icon: "Briefcase",
    requiredPermission: "projects.read",
    columns: [
      { key: "code", label: "Code", width: 110 },
      { key: "name", label: "Project Name", width: 220 },
      { key: "clientName", label: "Client", width: 180 },
      { key: "budget", label: "Budget", type: "currency", width: 130 },
      { key: "startDate", label: "Start", type: "date", width: 120 },
      { key: "endDate", label: "Target End", type: "date", width: 120 },
      { key: "status", label: "Status", type: "badge", width: 110 },
    ],
    filters: [
      { key: "search", label: "Search project name or client", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Planning", label: "Planning" },
          { value: "Active", label: "Active" },
          { value: "OnHold", label: "On Hold" },
          { value: "Completed", label: "Completed" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "project",
          label: "Project Scope",
          fields: [
            { key: "name", label: "Project Name", type: "text", required: true, span: 2 },
            { key: "code", label: "Project Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 1 },
            { key: "clientName", label: "Client Name", type: "text", span: 1 },
            { key: "startDate", label: "Start Date", type: "date", span: 1 },
            { key: "endDate", label: "Target Completion", type: "date", span: 1 },
            { key: "budget", label: "Budget (INR)", type: "currency", span: 1 },
            { key: "description", label: "Project Scope & Description", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Project", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "export", label: "Export Projects", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalProjects", label: "Total Projects", icon: "Briefcase", color: "indigo" },
      { key: "activeProjects", label: "Active Engagements", icon: "Clock", color: "green" },
      { key: "totalBudget", label: "Combined Budget", icon: "IndianRupee", color: "blue" },
    ],
  },
  "projects.tasks": {
    pageKey: "projects.tasks",
    title: "Project Tasks & Milestones",
    subTitle: "Track project deliverables, work breakdown structures, assignees, deadlines, and completion statuses.",
    entityName: "ProjectTask",
    moduleKey: "projects",
    viewType: "table",
    apiEndpoint: "/api/v1/project-tasks",
    icon: "CheckSquare",
    requiredPermission: "projects.read",
    columns: [
      { key: "taskCode", label: "Task Code", width: 120 },
      { key: "title", label: "Task Title", width: 260 },
      { key: "assignedToName", label: "Assigned To", width: 180 },
      { key: "status", label: "Status", type: "badge", width: 120 },
      { key: "priority", label: "Priority", type: "badge", width: 100 },
      { key: "dueDate", label: "Due Date", type: "date", width: 130 },
      { key: "estimatedHours", label: "Est. Hours", type: "number", width: 110 },
    ],
    filters: [
      { key: "search", label: "Search tasks or assignees", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Open", label: "Open" },
          { value: "InProgress", label: "In Progress" },
          { value: "Review", label: "In Review" },
          { value: "Completed", label: "Completed" },
          { value: "Cancelled", label: "Cancelled" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "task_info",
          label: "Task Specifications",
          fields: [
            { key: "title", label: "Task Title", type: "text", required: true, span: 2 },
            { key: "projectId", label: "Project", type: "lookup", lookupEndpoint: "/projects", required: true, span: 1 },
            { key: "assignedToEmployeeId", label: "Assigned Employee", type: "lookup", lookupEndpoint: "/hrms/employees", span: 1 },
            {
              key: "status",
              label: "Status",
              type: "select",
              span: 1,
              options: [
                { value: "Open", label: "Open" },
                { value: "InProgress", label: "In Progress" },
                { value: "Review", label: "In Review" },
                { value: "Completed", label: "Completed" },
              ],
            },
            {
              key: "priority",
              label: "Priority",
              type: "select",
              span: 1,
              options: [
                { value: "1", label: "Low Priority" },
                { value: "2", label: "Medium Priority" },
                { value: "3", label: "High Priority" },
              ],
            },
            { key: "dueDate", label: "Due Date", type: "date", span: 1 },
            { key: "estimatedHours", label: "Estimated Effort (Hours)", type: "number", span: 1 },
            { key: "description", label: "Task Description & Milestones", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Create Task", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit Task", variant: "secondary", icon: "Pencil" },
    ],
    kpis: [
      { key: "totalTasks", label: "Total Tasks", icon: "CheckSquare", color: "indigo" },
      { key: "completedTasks", label: "Completed", icon: "CheckCircle2", color: "green" },
      { key: "pendingTasks", label: "In Progress / Review", icon: "Clock", color: "amber" },
    ],
  },
};
