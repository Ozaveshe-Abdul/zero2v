# AGENTS.md — Workspace Rules for zero2v

This file defines the styling guidelines, coding rules, database patterns, and design constraints for agents working on the **zero2v** (formerly VerifyNG) project. All contributions and modifications to the code must adhere to these rules.

---

## 1. Project Naming & Identity
* **Project Name**: Always use **zero2v** (all lowercase) in user-facing text, page titles, and code documentation.
* **Legacy Reference**: Never write "VerifyNG" or "CheckMyNINBVN" in any user-facing context. The external provider is CheckMyNINBVN, but the app itself is **zero2v**.

---

## 2. Tech Stack & Architecture
* **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
* **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage).
* **Payment Processing**: Paystack (webhooks under `/api/webhooks/paystack`).
* **Design Approach**: Mobile-first, premium GovTech trust meets FinTech speed.

---

## 3. Design System & Style Tokens
You must follow these color codes and styling parameters precisely to maintain design integrity across all screens:

### Colors
* **Primary (Forest Green)**: `#0D4C2E` / `#00341c` (used for primary action buttons, active states, headers).
* **Accent (Warm Gold)**: `#D4A017` / `#ffc641` / `#795900` (used for cost badges, progress bar fills, PDF buttons, balance totals).
* **Background**: `#F7F5F0` / `#fcf9f8` (off-white, prevents screen strain).
* **Surface**: `#FFFFFF` (white surfaces for cards, input containers).
* **Text**: `#1A1A1A` / `#1c1b1b` (dark charcoal for text readability).
* **Status Indicators**:
  * Success: `#059669` (emerald green)
  * Warning/Pending: `#D97706` (amber)
  * Error/Failure: `#DC2626` (red)
  * Info/Processing/Refunds: `#2563EB` (blue)

### Typography
* **Headings**: `Outfit` or clean humanist sans-serif (Bold).
* **Body Text**: `Inter` (Regular).
* **Sensitive Identifiers**: `JetBrains Mono` or equivalent monospace (strictly enforced for NINs, phone numbers, tracking IDs, reference codes, and report/audit IDs).
* **Cost Numbers**: `Inter` (SemiBold), always prefixed with `₦`.

### Layout & Elements
* **Mobile Viewport**: Primary designs optimized for 390×844px.
* **Cards**: White background, `12px` radius, box-shadow: `0 1px 4px rgba(0,0,0,0.08)`.
* **Buttons**: `10px` border radius, minimum height of `48px` (touch target optimization).
* **Input Fields**: `10px` border radius, 1px `#D1D5DB` border, transitioning to `#0D4C2E` focus outline.
* **Bottom Nav**: Persistent 5-tab menu (Home, Verify, Batch, Orders, History) with `60px` height and a subtle blurred glassmorphism style.

---

## 4. Key Logic & Behavioral Constraints

### Consent Forms (Crucial)
* **Default State**: Consent checkboxes MUST be unchecked on render. They must never be pre-filled.
* **UI Behavior**: Action buttons (e.g. "Verify NIN", "Start Batch") must remain disabled/grayed-out until the consent checkbox is checked AND all fields satisfy basic validation (e.g., NIN is exactly 11 digits).
* **Labeling**: Labels must contain specific authorization wording, not a generic "I agree".

### Credit & Wallet Operations
* **Exchange Rate**: 1 credit = 1 Naira (₦). Balance must be stored as integer values corresponding to Naira, but displayed to the user in Naira format (`₦1,250`).
* **Atomic Transactions**: Every verification follows an atomic process:
  1. Deduct cost from wallet balance.
  2. Call proxy API to external identity service.
  3. Log result in the transaction/audit history.
  4. **Refund Policy**: If the upstream API returns an error or fails, immediately refund the deducted credits in the same database transaction.

### Security Boundaries
* **Server-Side API Key Hiding**: The external API keys must never leak to the client. All lookups must proxy through Next.js server-side route handlers under `src/app/api/`.
* **Database Row Level Security (RLS)**: Row-level security must be active on all Supabase tables. Users must only access or modify records belonging to their authenticated session ID.

### Export & PDF Functions
* **User Experience**: Tapping download buttons must show a brief loading spinner on the button ("Generating...").
* **Execution**: Trigger native device share sheets on mobile, or direct browser downloads on desktop.

---

## 5. Directory & File Conventions
Organize new modules according to the project scaffold:
* **Components**: Add primitives under `components/ui/`, layout wrappers under `components/layout/`, and functional/feature cards in their respective feature subfolders (e.g., `components/verify/`, `components/batch/`).
* **Server Helpers**: Keep API helper wrappers (e.g. `auditLog.ts`, `rateLimit.ts`) strictly server-side. Never import them into client components.

---

## 6. BVN (Bank Verification Number) Strict Exclusion & Review Policy
* **General Exclusion**: BVN verification, BVN lookup, BVN phone search, and all other BVN-related features are strictly EXCLUDED from the zero2v project per product decision.
* **Accidental Implementations**: Do NOT implement any BVN input fields, tabs, API routes, or display widgets on any screen.
* **Mandatory Review**: Any implementation task or codebase requirement that mentions or references "BVN" must be paused and brought forward to the user for explicit review before proceeding. If there is no explicit instruction to proceed, it must be ignored as it is not important enough.
* **Mockup Legacy References**: Note that legacy mockup code contains placeholders referring to BVN (such as "BVN Phone", "BVN Verification (₦200/each)", "BVN: 2210 ***", or "Instant NIN & BVN Verification"). Do NOT build components for these; keep them disabled/hidden or ignore them completely.

---

## 7. Styling & Component Standard
* **Tailwind CSS & shadcn/ui**: Always use Tailwind CSS for styling and shadcn/ui components (e.g. Radix-based primitives). Custom HTML or raw inline styles must be the absolute last line of defense and should be avoided unless absolutely necessary.
* **Component Reuse**: Prioritize importing and extending existing shadcn components under `components/ui/` rather than reinventing UI primitives from scratch.

---

## 8. Visual Fidelity & Mockup Matching
* **Exact Screen Implementation**: Implement every screen to exactly match the stitch mockup designs. Refer to both the reference images (`screen.png`) and the corresponding markup templates (`code.html`) in each screen's directory under `stitch mock up/`.
* **Mobile-First Layout**: Maintain a mobile-first approach, matching the 390×844px styling of the mockup layouts.
* **Desktop Responsiveness**: Fully implement desktop responsiveness (using responsive Tailwind prefixes: `sm:`, `md:`, `lg:`, `xl:`) and verify layout correctness on desktop sizes before proceeding to the next screen or implementation phase.
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Zero2v Implementation Workflow
You are working on the `zero2v` NIN Verification App. Before implementing new features or making significant architectural changes, **always consult `REMAINING_TASKS.md`**.
This file acts as the source of truth for the project's incomplete components and guides your execution priorities.
