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
