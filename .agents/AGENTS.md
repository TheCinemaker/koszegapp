# KőszegApp Project Rules & Memory

This file contains persistent workspace rules and historical context for AI agents working on the `koszegapp` repository.

## ⚠️ CRITICAL RULES

### 1. Git Branching & Local Development Policy
- **Branch Target:** ALL new feature developments, UI restyling, cleanups, and edits must be made strictly on the **`koszegapp3`** branch.
- **Local-Only Working Rule:** ALL changes are kept strictly local on `koszegapp3`. **DO NOT git push** to GitHub/remote unless explicitly requested by the user!
- Never commit or push directly to `main` unless explicitly instructed to fix a live production issue there.
- Keep commits atomic and descriptive.

### 2. Fast Design Iteration & Post-Approval RENEW Logging (`RENEW.md`)
- **Fast Iteration Workflow:** First code and adjust UI/design directly. Show/review with the user. Only log changes into `RENEW.md` **AFTER the user approves** the design decision.
- Do not spend time heavily pre-documenting rules before user confirmation.

### 3. Core Design System Standard
- **Primary Design Mode:** All components, pages, and dialogs are designed for **Light Mode first** with perfect dark mode contrast fallback.
- **Primary Brand Accent Color:** Strictly use **`bg-indigo-500`** (`#6366F1`) for primary icons, accent buttons, action badges, and key interactive highlights.
- **Hover Accent State:** Strictly use **`hover:opacity-90`** on all `bg-indigo-500` interactive buttons and action elements for a smooth, premium hover feedback without color distortion.
- **Accent Text Color:** Strictly use **`text-indigo-500 dark:text-indigo-400`**.
- **Primary Radius:** All main cards, LiveHero containers, NearbyDiscovery cards, Bento grid tiles, search containers, floating dropdowns, and the floating navigation bar MUST strictly share the unified **`rounded-2xl` (16px / `1rem`)** curvature token for an elegant, non-bubbly, professional look.
- **Secondary Radius:** Interactive buttons, input fields inside cards, and inner preview cards use **`rounded-xl` (12px)**.
- **Micro Radius:** Icon tiles use **`rounded-lg` (8px)**.
- **Full Radius:** Category chips, badges, and pill buttons use **`rounded-full`**.
- **Dialog Radius:** Modal dialog cards use **`rounded-3xl` (24px)**.
- **No Random/Gold Accents:** Do not use custom gold borders (`#C8AF64`), gold text gradients, or sparkles icons unless explicitly requested for branding elements like the pass card itself. Standard text colors (`text-slate-900 dark:text-white`), bento card styles (`bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-[30px]`), and theme colors (indigo/blue `text-indigo-500 dark:text-indigo-400`, `bg-indigo-500`) must be used for buttons, links, and borders.

### 4. Loading UI & Animation Policy ("NO PULSING / NO BLINKING")
- **CRITICAL RULE - NO TEXT ANIMATION:** Under NO circumstances should any text, heading, or label be animated with `animate-pulse`, blinking, or pulsing effects ("NEM Villogtatunk semmit!").
- **Unified Loading Spinner Standard:** All loading states MUST use the rotating rounded square (squircle) spinner token:
  `<div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin" />`
- **Loading Label:** If text is displayed under the loading spinner, strictly use static, non-pulsing text:
  `<p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-3 tracking-wide">Betöltés...</p>`
  (Small, legible font, static display).
- **Reusable Component:** `import LoadingSpinner from '../components/LoadingSpinner';` available in `src/components/LoadingSpinner.jsx`.

### 5. KőszegPass Kiosk (Tablet) Mode Behavior
- **URL:** The reception tablet landing page is `/buy-pass` (handled by `src/pages/KoszegPass/KioskPurchase.jsx`).
- **Isolation:** When `localStorage.getItem('kiosk_mode') === 'true'` (set on `/buy-pass` click):
  - Global headers, footers/floating navbars, and the spotlight module (`SmartSpotlight`) must be completely hidden across the entire checkout flow (`/pass/register`, `/pass/buy`, `/pass/success`).
  - The back button in `PassRegister.jsx` must redirect to `/buy-pass` instead of the public `/pass` view.
  - The success screen (`PassSuccess.jsx`) must not store the generated pass token in `localStorage`, must show a giant QR code containing the download link for the guest, and must provide a "Kész / Új Vásárlás" button that wipes temporary state and redirects back to `/buy-pass`.
- **Navigation Safety:** In `App.jsx`, if the user navigates to any page outside the pass/buy-pass flows (not starting with `/pass` or `/buy-pass`), `kiosk_mode` is automatically removed from `localStorage` to restore normal phone view.
- **Hidden Config:** The settings modal on `/buy-pass` (to configure `kiosk_hotel_source`) is hidden behind a 5-second long press on the "visit" text in the logo header. The gear icon is deleted from the layout.
- **No-Scroll Policy:** Tablet kiosk pages must use viewport-aware height (`h-screen overflow-hidden`) and compact grids/flexboxes to guarantee they fit within landscape viewports without introducing vertical scrollbars.

### 6. Versioning & Dev Branch Policy
- **Base Version:** App version is bumped to **`5.0.0`** in `package.json`.
- **Patch Bumps:** Every time a completed feature unit (e.g. Home page redesign, Events module) is finished, increment the patch version (e.g. `5.0.0` -> `5.0.1` -> `5.0.2`).

## 🧠 SESSION MEMORY & ACTIVE RULES

### 1. Manual Event & JSON Management (Active until 2026-07-26)
- **Rule:** The user will not use the admin dashboard interface for new event creation for a week.
- **Action:** Any new events sent by the user (images, flyers, descriptions) must be manually coded directly into `public/data/events.json` or `public/data/surrounding_events.json`. All uploaded flyers/images must be copied, staged, committed, and pushed directly to both `koszegapp3` and `main` branches by the agent when requested.

### 2. Partner Data Collection (/adatbekero) & Admin Integration Rules
- **Standalone Form Route:** `/adatbekero` is a clean partner data collection page with zero navbar, header, or footer clutter. Branding must strictly use uppercase **VISITKŐSZEG** and **VISITKŐSZEG.HU**.
- **Form Heading:** The hero heading must strictly say **ADATBEKÉRÉS**.
- **File & Storage Strategy:**
  - Partner submissions are committed directly to GitHub directory `public/data/submissions/<slug>_<timestamp>.json` via Netlify function `submit-partner-form`, cached in `localStorage` key `visitkoszeg_partner_submissions`, and generated as `<name_slug>.json` download files.
  - Submissions do not require Supabase to function.
- **Admin Management (/admin):**
  - Integrated via `src/components/Admin/PartnerSubmissionsManager.jsx` under the `partner_submissions` tab ("📥 Partner Bekérők").
