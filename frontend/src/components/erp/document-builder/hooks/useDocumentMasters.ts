"use client";

import { useEffect, useState } from "react";
import { crmApi, financeApi, inventoryApi, procurementApi, salesApi } from "@/services/modules";
import type { DiscountScheme, MasterOption } from "../types";
import { asRows } from "../utils/calculations";
import {
  mapAccountOptions,
  mapCustomerOptions,
  mapItemOptions,
  mapVendorOptions,
} from "../utils/mappers";

export function useDocumentMasters() {
  const [customers, setCustomers] = useState<MasterOption[]>([]);
  const [vendors, setVendors] = useState<MasterOption[]>([]);
  const [items, setItems] = useState<MasterOption[]>([]);
  const [accounts, setAccounts] = useState<MasterOption[]>([]);
  const [schemes, setSchemes] = useState<DiscountScheme[]>([]);

  useEffect(() => {
    const load = () => {
      void Promise.all([
        crmApi.customers.getAll(1, 200).catch(() => ({ data: [] })),
        procurementApi.vendors.getAll(1, 200).catch(() => ({ data: [] })),
        inventoryApi.items.getAll(1, 200).catch(() => ({ data: [] })),
        financeApi.chartOfAccounts.getAll().catch(() => ({ data: [] })),
        salesApi.discounts.getActive().catch(() => ({ data: [] })),
      ]).then(([customerRes, vendorRes, itemRes, accountRes, schemeRes]) => {
        setCustomers(mapCustomerOptions(customerRes.data));
        setVendors(mapVendorOptions(vendorRes.data));
        setItems(mapItemOptions(itemRes.data));
        setAccounts(mapAccountOptions(accountRes.data));
        setSchemes(asRows<DiscountScheme>(schemeRes.data));
      });
    };

    load();
    window.addEventListener("erp:org-context-changed", load);
    return () => window.removeEventListener("erp:org-context-changed", load);
  }, []);

  return { customers, vendors, items, accounts, schemes };
}
