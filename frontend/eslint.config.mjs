import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    files: [
      "src/app/(protected)/documents/page.tsx",
      "src/app/(protected)/hrms/**/*.tsx",
      "src/app/(protected)/notifications/page.tsx",
      "src/app/(protected)/reports/**/*.tsx",
      "src/features/erp/components/CustomersManager.tsx",
      "src/features/erp/components/ItemsManager.tsx",
      "src/features/erp/components/VendorsManager.tsx",
      "src/features/hrms/components/LeaveManager.tsx",
      "src/hooks/useHrmsApi.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
