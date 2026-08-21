import { useQuery } from "@tanstack/react-query";
import { complianceApi } from "@/services/modules/finance";

type ComplianceReportRecord = {
  id?: string;
  reportType?: string;
  reportName?: string;
  name?: string;
  code?: string;
  frequency?: string;
  status?: string;
  dueDate?: string;
};

export const complianceReportsQueryKey = (page: number, pageSize: number) =>
  ["compliance", "reports", page, pageSize] as const;

export const useComplianceReports = (pageNumber = 1, pageSize = 50) =>
  useQuery({
    queryKey: complianceReportsQueryKey(pageNumber, pageSize),
    queryFn: async () => {
      const { data } = await complianceApi.reports.list(pageNumber, pageSize);
      const rows = (Array.isArray(data) ? data : []) as ComplianceReportRecord[];
      return rows.map((row, index) => ({
        id: row.id ?? `report-${index}`,
        actName: row.reportName ?? row.name ?? row.reportType ?? "Compliance Report",
        code: row.code ?? row.reportType ?? "—",
        frequency: row.frequency ?? "—",
        status: row.status ?? "Pending Return",
      }));
    },
    staleTime: 30_000,
  });
