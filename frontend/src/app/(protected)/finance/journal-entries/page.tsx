"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { JournalEntryForm } from "@/features/finance/components/JournalEntryForm";

export default function FinanceJournalEntriesPage() {
  return (
    <DynamicPage
      pageKey="finance.journal-entries"
      fallback={<JournalEntryForm />}
      renderMode="auto"
    />
  );
}

