"use client";

/**
 * Backward compatibility re-export for BankReconciliationManager.
 * The implementation has been refactored into the feature slice:
 * src/features/finance/bank-reconciliation/
 */
export * from "../bank-reconciliation";
export { default } from "../bank-reconciliation";
