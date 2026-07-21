# KőszegApp Project Rules & Memory

This file contains persistent workspace rules and historical context for AI agents working on the `koszegapp` repository.

## ⚠️ CRITICAL RULES

### 1. Git Branching & Commit Policy
- **Branch Target:** ALL new feature developments, UI restyling, cleanups, and edits must be pushed strictly to the **`koszegapp3`** branch.
- Never commit or push directly to `main` unless explicitly instructed to fix a live production issue there.
- Keep commits atomic and descriptive.

### 2. KőszegPass Kiosk (Tablet) Mode Behavior
- **URL:** The reception tablet landing page is `/buy-pass` (handled by `src/pages/KoszegPass/KioskPurchase.jsx`).
- **Isolation:** When `localStorage.getItem('kiosk_mode') === 'true'` (set on `/buy-pass` click):
  - Global headers, footers/floating navbars, and the spotlight module (`SmartSpotlight`) must be completely hidden across the entire checkout flow (`/pass/register`, `/pass/buy`, `/pass/success`).
  - The back button in `PassRegister.jsx` must redirect to `/buy-pass` instead of the public `/pass` view.
  - The success screen (`PassSuccess.jsx`) must not store the generated pass token in `localStorage`, must show a giant QR code containing the download link for the guest, and must provide a "Kész / Új Vásárlás" button that wipes temporary state and redirects back to `/buy-pass`.
- **Navigation Safety:** In `App.jsx`, if the user navigates to any page outside the pass/buy-pass flows (not starting with `/pass` or `/buy-pass`), `kiosk_mode` is automatically removed from `localStorage` to restore normal phone view.
- **Hidden Config:** The settings modal on `/buy-pass` (to configure `kiosk_hotel_source`) is hidden behind a 5-second long press on the "visit" text in the logo header. The gear icon is deleted from the layout.

### 3. Versioning & Dev Branch Policy
- **Base Version:** App version is bumped to **`5.0.0`** in `package.json`.
- **Patch Bumps:** Every time a completed feature unit (e.g. Home page redesign, Events module) is finished, increment the patch version (e.g. `5.0.0` -> `5.0.1` -> `5.0.2`).
- **Branch Restriction:** ALL development commits must strictly land on the **`koszegapp3`** (dev) branch. Never merge or push to `main` until a full feature unit is explicitly approved and finalized.

### 4. Design System & Aesthetics
- **Cohesion:** All new pages/dialogues must blend 100% with the design language of the visitKőszeg home page.
- **Border-Radius Consistency:** All main cards, LiveHero containers, NearbyDiscovery cards, Bento grid tiles, and the floating navigation bar MUST strictly share the unified **`rounded-[1.5rem]` (24px / `rounded-3xl`)** curvature token so that navbars and cards bend in perfect harmony.
- **No Random/Gold Accents:** Do not use custom gold borders (`#C8AF64`), gold text gradients, or sparkles icons unless explicitly requested for branding elements like the pass card itself. Standard text colors (`text-slate-900 dark:text-white`), bento card styles (`bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-[30px]`), and theme colors (indigo/blue `text-indigo-600 dark:text-indigo-400`, `bg-indigo-600`) must be used for buttons, links, and borders.
- **No-Scroll Policy:** Tablet kiosk pages must use viewport-aware height (`h-screen overflow-hidden`) and compact grids/flexboxes to guarantee they fit within landscape viewports without introducing vertical scrollbars.

## 🧠 SESSION MEMORY & ACTIVE RULES

### 1. Manual Event & JSON Management (Active until 2026-07-26)
# KőszegApp Project Rules & Memory

This file contains persistent workspace rules and historical context for AI agents working on the `koszegapp` repository.

## ⚠️ CRITICAL RULES

### 1. Git Branching & Commit Policy
- **Branch Target:** ALL new feature developments, UI restyling, cleanups, and edits must be pushed strictly to the **`koszegapp3`** branch.
- Never commit or push directly to `main` unless explicitly instructed to fix a live production issue there.
- Keep commits atomic and descriptive.

### 2. KőszegPass Kiosk (Tablet) Mode Behavior
- **URL:** The reception tablet landing page is `/buy-pass` (handled by `src/pages/KoszegPass/KioskPurchase.jsx`).
- **Isolation:** When `localStorage.getItem('kiosk_mode') === 'true'` (set on `/buy-pass` click):
  - Global headers, footers/floating navbars, and the spotlight module (`SmartSpotlight`) must be completely hidden across the entire checkout flow (`/pass/register`, `/pass/buy`, `/pass/success`).
  - The back button in `PassRegister.jsx` must redirect to `/buy-pass` instead of the public `/pass` view.
  - The success screen (`PassSuccess.jsx`) must not store the generated pass token in `localStorage`, must show a giant QR code containing the download link for the guest, and must provide a "Kész / Új Vásárlás" button that wipes temporary state and redirects back to `/buy-pass`.
- **Navigation Safety:** In `App.jsx`, if the user navigates to any page outside the pass/buy-pass flows (not starting with `/pass` or `/buy-pass`), `kiosk_mode` is automatically removed from `localStorage` to restore normal phone view.
- **Hidden Config:** The settings modal on `/buy-pass` (to configure `kiosk_hotel_source`) is hidden behind a 5-second long press on the "visit" text in the logo header. The gear icon is deleted from the layout.

### 3. Design System & Aesthetics
- **Cohesion:** All new pages/dialogues must blend 100% with the design language of the visitKőszeg home page.
- **No Random/Gold Accents:** Do not use custom gold borders (`#C8AF64`), gold text gradients, or sparkles icons unless explicitly requested for branding elements like the pass card itself. Standard text colors (`text-slate-900 dark:text-white`), bento card styles (`bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-[30px]`), and theme colors (indigo/blue `text-indigo-600 dark:text-indigo-400`, `bg-indigo-600`) must be used for buttons, links, and borders.
- **No-Scroll Policy:** Tablet kiosk pages must use viewport-aware height (`h-screen overflow-hidden`) and compact grids/flexboxes to guarantee they fit within landscape viewports without introducing vertical scrollbars.

## 🧠 SESSION MEMORY & ACTIVE RULES

### 1. Manual Event & JSON Management (Active until 2026-07-26)
- **Rule:** The user will not use the admin dashboard interface for new event creation for a week.
- **Action:** Any new events sent by the user (images, flyers, descriptions) must be manually coded directly into `public/data/events.json` or `public/data/surrounding_events.json`. All uploaded flyers/images must be copied, staged, committed, and pushed directly to both `koszegapp3` and `main` branches by the agent. Do not ask the user to use the admin page.

### 2. Partner Data Collection (/adatbekero) & Admin Integration Rules
- **Standalone Form Route:** `/adatbekero` is a clean partner data collection page with zero navbar, header, or footer clutter. Branding must strictly use uppercase **VISITKŐSZEG** and **VISITKŐSZEG.HU**.
- **Form Heading:** The hero heading must strictly say **ADATBEKÉRÉS** (do not use animal feed / "táp" phrases).
- **File & Storage Strategy:**
  - Partner submissions are committed directly to GitHub directory `public/data/submissions/<slug>_<timestamp>.json` via Netlify function `submit-partner-form`, cached in `localStorage` key `visitkoszeg_partner_submissions`, and generated as `<name_slug>.json` download files.
  - Submissions do not require Supabase to function.
- **Admin Management (/admin):**
  - Integrated via `src/components/Admin/PartnerSubmissionsManager.jsx` under the `partner_submissions` tab ("📥 Partner Bekérők").
  - `PartnerSubmissionsManager.jsx` queries the GitHub `public/data/submissions/` folder via `get-partner-submissions` to present all live partner submissions.
  - Merging or deleting a submission removes the individual file from `public/data/submissions/` on GitHub via `delete-github-file`.
  - `partner_submissions` entry in `EDITABLE_CONTENT` in `Admin.jsx` must be placed at the END of the object with `path: ""` and `isCustomManager: true` so it does not trigger generic Netlify JSON fetching functions or override the default "Programok" tab when opening Admin.
