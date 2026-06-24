# Remaining Tasks for zero2v Implementation

This document outlines the remaining tasks required to complete the NIN Verification App, based on the original `NINBVN_APP_PLAN.md`.

*Note: Phase 1 (Project Scaffold & Auth) has been partially completed. Next.js structure is up, Supabase clients are ready, and Auth UI forms (Login/Register/Callback) are wired.*

## 1. Supabase Schema & RLS Execution (Phase 2)
- Execute the SQL from `supabase_schema.sql` (Tables, Enums, Triggers, RPCs like `deduct_credits` and `credit_wallet`, RLS policies) in your Supabase instance.
- Create a Supabase Storage bucket named `batch-results` with the appropriate RLS policies for user isolation.

## 2. Core API Integration (Phase 4)
- **Implement `src/lib/ninbvn.ts`**: Write the proxy wrapper around the upstream CheckMyNINBVN API.
- **Implement Verification Routes**: Write the handlers for `/api/verify/nin`, `/api/verify/nin-phone`, `/api/verify/nin-tracking`, and `/api/verify/nin-demography`.
- Ensure each route uses Zod validation, checks wallet balances, executes `deduct_credits`, handles atomic refunds on upstream failure, and writes audit logs.

## 3. Core Verification UI (Phase 5)
- Replace dummy UI components (e.g., `NINForm`, `NINPhoneForm`, `DemographyForm`) in `src/components/verify/` with functional React forms.
- Ensure forms pass standard validation and strictly enforce the `consent: true` checkbox logic before calling the backend API proxies.

## 4. Wallet & Paystack Integration (Phase 3)
- **Backend**: Implement the `/api/wallet/initiate` route to generate Paystack auth URLs.
- **Webhooks**: Implement `/api/webhooks/paystack` to handle webhook events securely, verifying signatures and calling `credit_wallet`.
- **Frontend**: Replace hardcoded data in `src/app/wallet/page.tsx` and implement the `FundWalletForm` using the `paystack.ts` helper (if applicable) or backend initialization.

## 5. Batch Processing Engine (Phase 6)
- **Backend API**: Write the handler in `/api/batch/[endpoint]/route.ts` to manage batch submission, validate total cost upfront, and spawn the background process.
- **Background Worker**: Implement the sequential processing loop with 300ms delays to avoid rate-limiting upstream.
- **Frontend UI**: Implement `BatchInput` and `BatchProgress` components for polling/SSE and triggering batch runs.

## 6. ~~Dashboard, History, and Orders (Phases 7 & 8)~~ (Completed)
- ~~[x] **Orders API**: Implement `/api/orders/route.ts` and `/api/orders/[reference]/route.ts`.~~
- ~~[x] **Frontend Views**: Replace static layouts in the Dashboard, History, and Orders pages to fetch data securely from `api_calls`, `modification_orders`, and `transactions` tables.~~
- ~~[x] **PDF Export**: Complete the client-side (`jsPDF`) and server-side (`pdfkit`) report generators in `src/lib/pdfExport.ts`.~~

## 7. ~~Security, Hardening & Testing (Phases 9 & 10)~~ (Completed)
- ~~[x] Add CSP and required security headers to `next.config.ts`.~~
- ~~[x] Implement sliding-window rate-limiting in `src/lib/rateLimit.ts` and wire it to middleware.~~
- ~~[x] Configure `eslint.config.mjs` to block unauthorized imports.~~
- ~~[x] Write unit, integration, and Playwright E2E tests for verification flows and payment webhooks.~~
