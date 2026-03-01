# Design Token Structure — shadcn UI Kit (Radiant Theme)

Summary of the design token structure for the **shadcn UI kit for Figma** library, with focus on variable collections, their connection points, and the **Radiant** branding palette used as the single theme.

**Figma file:** [shadcn_ui-kit-for-Figma - Pro Blocks - New York - January 2025](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/shadcn_ui-kit-for-Figma---Pro-Blocks---New-York---January-2025?node-id=580-9181)

---

## 1. Variable collections (Figma)

The library is built on **Figma variables** (collections and modes). Typical structure:

| Collection role | Purpose |
|-----------------|--------|
| **Primitives / base colors** | Raw palettes (e.g. Slate, Radiant, semantic hues like Amber, Red, Blue) with numeric steps (50–950). |
| **Semantic tokens** | UI roles (background, foreground, primary, border, etc.) that **reference** primitives. |
| **Component tokens** | Optional layer (e.g. button, input) that reference semantic or primitives. |

Connection between collections:

- **Semantic variables** → point to **primitive variables** (e.g. `primary` → `Radiant/700`).
- **Modes** (e.g. Light / Dark) switch which primitive a semantic token points to (e.g. Light: `primary` = Radiant 700, Dark: `primary` = Radiant 200).

So the **connection point** is: **semantic tokens are bound to primitive variables**, and **modes** change those bindings for light/dark.

---

## 2. Radiant palette (custom branding)

**Radiant** is the custom branding palette and the only theme in use. It is a **blue‑leaning** scale (oklch hue ~221–236°).

### 2.1 Radiant scale (primitives)

| Token | Value (OKLCH) | Use |
|-------|----------------|-----|
| `radiant-50`  | `oklch(0.98 0.01 228.92)`  | Lightest tint |
| `radiant-100` | `oklch(0.96 0.03 231.05)`  | |
| `radiant-200` | `oklch(0.91 0.06 224.03)`  | Primary (dark mode), ring (dark) |
| `radiant-300` | `oklch(0.85 0.1 221.85)`   | |
| `radiant-400` | `oklch(0.79 0.14 223.72)`  | |
| `radiant-500` | `oklch(0.73 0.14 227.83)`  | |
| `radiant-600` | `oklch(0.63 0.13 233.32)`  | |
| `radiant-700` | `oklch(0.53 0.11 234.92)`  | **Primary (light), ring (light), sidebar-primary** |
| `radiant-800` | `oklch(0.47 0.09 231.27)`  | |
| `radiant-900` | `oklch(0.41 0.08 233.79)`  | |
| `radiant-950` | `oklch(0.31 0.06 236.35)`  | **Foreground text (primary surfaces)** |

In code (e.g. `portal/frontend/src/index.css`), these are exposed as `--color-radiant-50` … `--color-radiant-950`.

---

## 3. Semantic tokens (Radiant theme)

Semantic tokens are the **connection point**: they don’t define raw color; they reference primitives (Radiant, Slate, etc.) so one theme (Radiant) is applied consistently.

### 3.1 Core UI

| Semantic token | Light | Dark |
|----------------|-------|------|
| `background` | white | slate-950 |
| `foreground` | radiant-950 | slate-50 |
| `card` / `card-foreground` | white / radiant-950 | slate-950 / slate-50 |
| `popover` / `popover-foreground` | white / radiant-950 | slate-950 / slate-50 |
| **`primary`** | **radiant-700** | **radiant-200** |
| **`primary-foreground`** | slate-50 | radiant-950 |
| `secondary` / `secondary-foreground` | slate-100 / radiant-950 | slate-700 / slate-50 |
| `muted` / `muted-foreground` | slate-100 / slate-500 | slate-800 / slate-400 |
| `accent` / `accent-foreground` | slate-100 / radiant-950 | slate-800 / slate-50 |
| `destructive` / `destructive-foreground` | red-600 / red-50 | red-900 / red-50 |
| `border` | slate-200 | slate-800 |
| `input` | slate-300 | slate-800 |
| **`ring`** | **radiant-700** | **radiant-200** |

### 3.2 Sidebar

| Semantic token | Light | Dark |
|----------------|-------|------|
| `sidebar` | slate-50 | slate-900 |
| `sidebar-foreground` | slate-700 | slate-100 |
| **`sidebar-primary`** | **radiant-700** | **radiant-200** |
| `sidebar-primary-foreground` | slate-50 | radiant-950 |
| `sidebar-accent` / `sidebar-accent-foreground` | slate-100 / slate-950 | slate-800 / slate-100 |
| `sidebar-border` | slate-200 | slate-800 |
| `sidebar-ring` | slate-400 | slate-300 |

### 3.3 Tables

| Semantic token | Light | Dark |
|----------------|-------|------|
| `table-header` | slate-100 | slate-900 |
| `table-accent` | slate-50 | slate-900 |

### 3.4 Charts

`chart-1` … `chart-5` are fixed oklch values (different in light and dark) and are not tied to the Radiant palette.

### 3.5 Radius

| Token | Value |
|-------|--------|
| `radius` (base) | `0.5rem` |
| `radius-sm` | `calc(var(--radius) - 4px)` |
| `radius-md` | `calc(var(--radius) - 2px)` |
| `radius-lg` | `var(--radius)` |
| `radius-xl` | `calc(var(--radius) + 4px)` |

### 3.6 Typography (Figma: text styles)

| Token | Font size | Line height | Tailwind class |
|-------|-----------|-------------|----------------|
| `heading-1` | 30px | 38px | `text-heading-1` |
| `body-lg` | 16px | 24px | `text-body-lg` |

Default scale (`text-sm`, `text-base`, `text-lg`, etc.) remains available; use semantic tokens for hero, headings, and body copy to match Figma.

### 3.7 Layout & sizing (Figma: spacing, dimensions)

| Token | Value | Tailwind class |
|-------|--------|----------------|
| `height-navbar` | 44px | `h-navbar` |
| `width-hero-column` | 600px | `w-hero-column` |
| `max-width-content` | 768px | `max-w-content` |
| `height-logo-dots` | 120px | `h-logo-dots` |
| `spacing-section-x` | 4rem | `px-section-x` |
| `spacing-section-y` | 2.5rem | `py-section-y` |
| `border-width-pinned` | 3px | `border-pinned`, `border-r-pinned`, etc. |
| `ring-width-focus` | 3px | `ring-[length:var(--ring-width-focus)]` (or token in `:root`) |

### 3.8 Hero / landing (semantic surface)

| Token | Value | Use |
|-------|--------|-----|
| `hero` | `#1c3863` | Hero background (CHU Sainte-Justine brand) |
| `hero-overlay` | `rgba(255, 255, 255, 0.23)` | Soft-light overlay on hero image |

Tailwind: `bg-hero`, `bg-hero-overlay`.

---

## 4. Badge / semantic color tokens (Radiant theme)

Badge and semantic colors (amber, red, green, etc.) use **intermediate** tokens so light/dark can pick different steps of the same hue:

| Semantic (Tailwind) | Light primitive | Dark primitive |
|--------------------|-----------------|----------------|
| amber | amber-500 / amber-800 | amber-600 / amber-400 |
| red | red-400 / red-700 | red-700 / red-400 |
| orange | orange-400 / orange-800 | orange-400 / orange-400 |
| yellow | yellow-400 / yellow-800 | yellow-400 / yellow-400 |
| lime | lime-400 / lime-800 | lime-400 / lime-400 |
| green | green-300 / green-800 | green-400 / green-300 |
| cyan | cyan-400 / cyan-800 | cyan-400 / cyan-400 |
| blue | blue-400 / blue-700 | blue-800 / blue-400 |
| violet | violet-400 / violet-700 | violet-800 / violet-400 |
| fuchsia | fuchsia-400 / fuchsia-700 | fuchsia-600 / fuchsia-400 |

In the codebase these appear as `--radiant-{hue}-{step}` (e.g. `--radiant-amber-500`) and are mapped from primitive scales (`--color-amber-500`, etc.); **Radiant** here means “the set of semantic hue tokens used in the Radiant theme,” not the blue Radiant scale.

---

## 5. Token flow (connection points)

```
┌─────────────────────────────────────────────────────────────────┐
│  FIGMA VARIABLE COLLECTIONS                                      │
├─────────────────────────────────────────────────────────────────┤
│  Primitives          Semantic (Radiant theme)     Modes          │
│  ───────────        ─────────────────────────     ─────          │
│  Radiant 50–950  ──► primary, ring,               Light / Dark   │
│  Slate 50–950    ──► background, border,          (switch refs)  │
│  Amber, Red,…    ──► badge/semantic colors                       │
│  (numeric steps)     (e.g. destructive, chart)                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  CODE (CSS custom properties)                                     │
│  @theme inline → --color-* (Tailwind)                            │
│  :root / .dark → semantic tokens → primitives (Radiant, Slate)   │
└─────────────────────────────────────────────────────────────────┘
```

- **Figma:** Semantic variables reference primitive variables; modes change those references for Light/Dark.
- **Code:** Semantic tokens (`--primary`, `--ring`, etc.) reference `--color-radiant-*` and `--color-slate-*`; `.dark` overrides which primitive step is used.

---

## 6. Summary

| Layer | Role |
|-------|------|
| **Primitives** | Radiant (brand 50–950), Slate (neutrals), plus hue scales (amber, red, blue, etc.) with numeric steps. |
| **Connection** | Semantic tokens point to primitives; **Radiant theme** = primary/ring/sidebar-primary (and foreground on primary) use the **Radiant** palette; neutrals use **Slate**. |
| **Modes** | Light/Dark switch semantic→primitive bindings (e.g. primary: radiant-700 vs radiant-200). |
| **Radiant palette** | Custom blue‑leaning scale (oklch); the only theme in use; drives primary, ring, sidebar-primary, and primary foreground in dark. |

For design-to-code alignment, keep Figma semantic variable names and bindings in sync with the tokens in `portal/frontend/src/index.css` (e.g. `--primary` → Radiant 700/200, `--ring` → same, `--foreground` → radiant-950 in light).
