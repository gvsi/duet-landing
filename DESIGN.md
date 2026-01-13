# Duet Landing - Design Guidelines

This document outlines the design philosophy, patterns, and system for the Duet Mail marketing site (`duetmail.com`). Adhering to these guidelines ensures visual consistency, accessibility, and high performance across the site.

## 1. Design Philosophy

**"Premium Utility & Editorial Elegance"**

*   **Premium Utility:** The interface should feel like a high-end tool—precise, performant, and reliable. It avoids flashy distractions in favor of clear functionality and trust.
*   **Editorial Elegance:** Content consumption (especially the blog) mimics a high-quality editorial publication. Typography is paramount, spacing is generous, and reading rhythm is carefully calibrated.
*   **Light Mode Priority:** The primary aesthetic is clean, warm, and readable light mode. Dark mode is supported as a secondary preference but must not compromise the integrity of the light experience.

## 2. Typography

We use a dual-font system to create hierarchy and character.

*   **Sans-Serif (Primary):** `Manrope Variable`
    *   **Usage:** UI elements, body text, buttons, navigation, meta-data.
    *   **Characteristics:** Modern, geometric, high legibility at small sizes.
    *   **Fallbacks:** `ui-sans-serif`, `system-ui`.
*   **Serif (Editorial):** `Domine Variable`
    *   **Usage:** Headings (`h1`, `h2`, `h3`), blockquotes, feature highlights.
    *   **Characteristics:** Contemporary slab-serif, authoritative yet warm, excellent for display and reading.
    *   **Fallbacks:** `ui-serif`, `Georgia`.

### Scale & Hierarchy
*   **Base Size:** 17px (optimal for long-form reading).
*   **Line Height:**
    *   **Body:** 1.6 - 1.82 (relaxed for readability).
    *   **Headings:** 1.2 - 1.4 (tighter for impact).
*   **Weights:**
    *   **Regular (400):** Body text.
    *   **Medium (500):** UI labels, emphasis.
    *   **Semi-Bold (600):** Headings, buttons.

## 3. Color System

The color palette is semantic and theme-aware (CSS variables handle light/dark switching).

### Core Palette
*   **Background (`--duet-bg`):**
    *   *Dark:* `#08081a` (Deep indigo-black)
    *   *Light:* `#fafafa` (Warm off-white)
*   **Foreground (`--duet-fg`):**
    *   *Dark:* `#ffffff`
    *   *Light:* `#1a1a1f`
*   **Accent (`--duet-accent`):**
    *   *Primary:* `#4530ea` (Vibrant Indigo)
    *   *Secondary:* `#74c2ff` (Sky Blue - often used for gradients/highlights)
*   **Muted (`--duet-muted`):** `#a8a8b3` (Dark) / `#6b6b76` (Light) - Used for secondary text, borders, and sub-labels.

### Semantic Usage
*   **Borders:** Subtle (`rgba(255,255,255,0.06)` in dark) for structure without visual weight.
*   **Badges:** Translucent backgrounds with distinct borders.
*   **Code Blocks:** Low-contrast backgrounds (`rgba(255,255,255,0.05)` in dark) to let syntax highlighting pop.

## 4. UI Patterns & Components

### Buttons & CTAs
*   **Primary:** Solid background (Accent or White/Black contrast), semi-bold text, rounded corners (often pill-shaped or slightly squared).
    *   *Reference:* `src/components/ui/Button.astro`
*   **Secondary:** Outline or ghost style, subtle border/background on hover.
*   **Behavior:** Static links to `app.duetmail.com`. No loading spinners or complex states on the landing page.

### Layout & Spacing
*   **Container:** Centered with max-width (typically `max-w-7xl` or `max-w-prose` for blogs).
    *   *Reference:* `src/components/ui/Container.astro`
*   **Section Spacing:** Generous vertical rhythm (`py-24`, `py-32`) to let content breathe.
    *   *Reference:* `src/components/ui/Section.astro`
*   **Grid:** Simple, responsive grids (1 col mobile -> 2/3 col desktop) using CSS Grid/Flexbox.

### Visual Effects
*   **Glassmorphism:** Used sparingly on sticky navigation and overlay cards (`backdrop-blur`).
    *   *Reference:* `src/components/nav/Nav.astro`
*   **Gradients:** Subtle background glows (radial gradients) to add depth behind hero sections or feature cards.
    *   *Reference:* `src/components/sections/HeroBackground.astro`
*   **Shadows:** Soft, diffused shadows for floating elements (mockups, cards) to create elevation.
    *   *Reference:* `src/components/sections/InboxHeroMockup.astro`

## 5. Editorial/Blog Styling (`.duet-prose`)

The blog uses a specialized `.duet-prose` class for enhanced reading experiences (Reference: `src/styles/global.css`):
*   **Drop Caps:** First letter of the first paragraph is styled (serif, large float).
*   **Blockquotes:** Indented with a colored border and serif italic font.
*   **Links:** Underlined with a thin, offset line that thickens/colors on hover.
*   **Lists:** Custom bullets (small circles) or serif numbers.
*   **Dividers:** Ornamental center-aligned dividers (`* * *`) for section breaks.


## 6. Iconography & Imagery

*   **Icons:** Inline SVGs (Lucide or similar simple stroke icons). Consistent stroke width (usually 1.5px or 2px).
*   **Imagery:**
    *   **Hero:** High-quality app mockups (static AVIF/WebP).
    *   **Features:** Abstract UI snippets or conceptual diagrams.
    *   **Treatment:** Rounded corners, subtle borders, and soft shadows to blend with the UI.

## 7. Accessibility (A11y)

*   **Contrast:** Ensure text meets WCAG AA standards (especially muted text).
*   **Focus States:** Visible focus rings on all interactive elements.
*   **Motion:** Respect `prefers-reduced-motion` (disable smooth scrolling and layout animations).
*   **Semantics:** Proper heading hierarchy (`h1` -> `h6`), `<nav>`, `<main>`, `<article>`, `<aside>`.
