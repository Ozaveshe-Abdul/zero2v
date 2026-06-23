import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["**/lib/supabase/service*", "**/lib/ninbvn*", "**/lib/paystack*", "**/lib/auditLog*"],
          "message": "Server-only module. Import only in app/api/ routes."
        }]
      }]
    }
  }
]);

export default eslintConfig;
