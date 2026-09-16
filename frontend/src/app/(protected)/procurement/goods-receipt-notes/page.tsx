"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { GoodsReceiptNotesManager } from "@/features/procurement/components/GoodsReceiptNotesManager";

export default function GoodsReceiptNotesPage() {
  return (
    <DynamicPage
      pageKey="procurement.grn"
      fallback={<GoodsReceiptNotesManager />}
      renderMode="auto"
    />
  );
}
