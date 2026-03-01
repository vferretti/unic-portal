# Design System — UnIC Portal

Design system for the UnIC portal frontend, aligned with the **shadcn UI kit for Figma** (Radiant theme) and implemented with **Tailwind CSS v4** and CSS custom properties.

**Figma:** [shadcn_ui-kit-for-Figma - Pro Blocks - New York - January 2025](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/shadcn_ui-kit-for-Figma---Pro-Blocks---New-York---January-2025?node-id=580-9181)

**Code:** `portal/frontend/src/index.css` (tokens) + Tailwind `@theme` (utilities)

---

## 1. Principles

- **Tokens over raw values** — Use design tokens (e.g. `text-heading-1`, `bg-primary`, `h-navbar`) instead of arbitrary values (`text-[30px]`, `bg-[#1C3863]`, `h-[44px]`).
- **Figma as source of truth** — Colors, radius, typography, and spacing in code mirror Figma variable collections and modes (Light/Dark).
- **Semantic naming** — Prefer semantic tokens (`primary`, `foreground`, `hero`) over primitives (`radiant-700`, `#1c3863`) in component class names.

---

## 2. Token overview

| Category | Where defined | Examples |
|----------|----------------|----------|
| **Colors** | `:root` / `.dark` + `@theme` | `bg-primary`, `text-foreground`, `bg-hero` |
| **Radius** | `:root` + `@theme` | `rounded-md`, `rounded-lg` |
| **Typography** | `@theme` | `text-heading-1`, `text-body-lg` |
| **Layout / sizing** | `@theme` | `h-navbar`, `w-hero-column`, `max-w-content`, `px-section-x` |
| **Border / ring** | `@theme` + `:root` | `border-pinned`, `--ring-width-focus` |
| **Breakpoints** | `@theme` | `md:`, `xl:` (768px, 1280px) |

---

## 3. Using tokens in components

### Colors

- **Surfaces & text:** `bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-primary-foreground`.
- **Landing / hero:** `bg-hero`, `bg-hero-overlay`.
- **Borders & inputs:** `border-border`, `bg-input`, `ring-ring`.

### Typography

- **Headings:** `text-heading-1` (30px / 38px line height).
- **Body:** `text-body-lg` (16px / 24px), or default `text-sm`, `text-base`.

### Layout

- **Navbar:** `h-navbar` (44px).
- **Hero column:** `w-hero-column` (600px).
- **Content width:** `max-w-content` (768px).
- **Section padding (desktop):** `px-section-x`, `py-section-y`.

### Focus & borders

- **Focus ring:** `ring-[length:var(--ring-width-focus)]` (3px).
- **Pinned table borders:** `border-r-pinned`, `border-l-pinned` (3px).

---

## 4. Adding or changing tokens

1. **Figma** — Add or change variables in the right collection (primitives vs semantic) and mode (Light/Dark).
2. **Code** — Update `portal/frontend/src/index.css`:
   - **`@theme inline`** — Add or change tokens that should generate Tailwind utilities (e.g. `--font-size-heading-1`, `--height-navbar`, `--color-hero`).
   - **`:root` / `.dark`** — Add or change semantic CSS variables that are referenced by `@theme` (e.g. `--hero`, `--primary`).
3. **Docs** — Update `docs/design-token-structure.md` and this README so Figma and code stay documented.

---

## 5. File reference

| File | Purpose |
|------|---------|
| `portal/frontend/src/index.css` | All design tokens: `@theme`, `:root`, `.dark`, base styles. |
| `docs/design-token-structure.md` | Detailed token list and Figma ↔ code mapping. |
| `docs/design-system.md` | This file — usage and principles. |

---

## 6. Summary

Use **design system tokens** (e.g. `text-heading-1`, `bg-hero`, `h-navbar`, `max-w-content`) instead of hard-coded values. Keep tokens in sync with the Figma library and document any new tokens in `design-token-structure.md` and this README.
