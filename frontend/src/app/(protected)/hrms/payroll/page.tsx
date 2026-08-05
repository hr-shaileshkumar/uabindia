import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function HrmsPayrollPage() {
  redirect(ROUTES.PAYROLL_RUNS);
}
