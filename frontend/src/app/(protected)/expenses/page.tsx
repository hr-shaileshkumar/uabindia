"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ExpenseList } from "@/features/expenses/components/ExpenseList";

export default function ExpensesRoute() {
  return (
    <DynamicPage
      pageKey="finance.expenses"
      fallback={<ExpenseList />}
      renderMode="auto"
    />
  );
}

