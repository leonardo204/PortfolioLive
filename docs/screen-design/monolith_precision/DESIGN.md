# Design System Document: The Sovereign Engineer

## 1. Overview & Creative North Star
**Creative North Star: The Intellectual Architect**

This design system is built to reflect the mind of a senior engineer: precise, intentional, and void of unnecessary noise. It moves beyond the "standard SaaS" aesthetic by adopting an editorial posture inspired by high-end technical journals and minimalist workspaces like Linear and Anthropic.

The experience is not "decorated"; it is "constructed." We break the template look through **intentional white space as a first-class element**. By using extreme typographic scale contrasts and a "less-is-more" approach to containment, we shift the focus from the UI to the caliber of the work. The layout should feel like a well-composed technical white paper—authoritative, breathable, and timeless.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a high-contrast monochromatic base, punctuated by a singular, functional blue.

### Surface Hierarchy & The "No-Line" Rule
To achieve a premium feel, we move away from the "boxes inside boxes" layout. 
- **The "No-Line" Rule:** Prohibit the use of 1px solid borders for sectioning. Boundaries must be defined by shifts in the background color. Use `surface` (#f8f9fb) as your canvas, and `surface-container-low` (#f1f4f7) to denote a change in context or section.
- **Nesting Tiers:** Create depth through tonal shifts rather than lines. A card (`surface-container-lowest` / #ffffff) sitting on a section background (`surface-container-low` / #f1f4f7) creates a natural, soft lift that feels integrated, not "pasted."
- **Glass & Depth:** For navigation bars or floating action menus, use Glassmorphism. Apply `surface` with 80% opacity and a `20px` backdrop-blur. This ensures the content "flows" underneath the UI, maintaining a sense of continuity.

### Signature Highlights
While the core is flat, use the `primary` (#0053db) to `primary-container` (#dbe1ff) gradient sparingly on high-impact CTAs or the primary "Current Status" indicator. This subtle "soul" prevents the minimalism from feeling clinical.

---

## 3. Typography: The Editorial Edge
Typography is the primary vehicle for the brand identity. We use **Inter** not just for legibility, but for its geometric authority.

- **Display Scale (`display-lg` to `display-sm`):** Reserved for name and major project titles. Use these to create a "Power Gap"—significant white space surrounding a single, large line of text.
- **Headline & Title:** Use `Semibold` (600 weight) for headers to create a "thick" visual anchor against the `Regular` (400 weight) body text. 
- **High-Contrast Hierarchy:** The jump between `headline-lg` (2rem) and `body-md` (0.875rem) should be sharp. This contrast tells the user exactly where the narrative begins and where the details live.
- **Labeling:** Use `label-md` in all-caps with `0.05em` letter spacing for technical metadata (e.g., "STACK," "YEAR," "ROLE"). This provides a "technical blueprint" feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for this system. We use **Tonal Layering** and **Ambient Light**.

- **The Layering Principle:** Depth is achieved by stacking. 
    1. Base: `surface`
    2. Content Areas: `surface-container-low`
    3. Interactive Cards: `surface-container-lowest` (White)
- **Ambient Shadows:** Only use shadows on hover states or floating modals. Use a highly diffused shadow: `0px 12px 32px rgba(43, 52, 56, 0.04)`. The shadow color is derived from `on-surface` (#2b3438) to keep it natural.
- **The Ghost Border:** If accessibility requires a border, use the `outline-variant` token at 15% opacity. It should be felt, not seen.

---

## 5. Components: Precision Built

### Cards & Projects
*   **Style:** No visible borders in a static state. Use `surface-container-lowest` background.
*   **Interaction:** On hover, apply the Ambient Shadow and a 1px `primary-fixed-dim` (#c7d3ff) border. 
*   **Constraint:** Forbid divider lines within cards. Use `24px` or `32px` gaps (Spacing Scale) to separate the project image from the description.

### Vertical Timeline (Experience)
*   **Line:** A 1px vertical stroke using `outline-variant` at 20% opacity.
*   **Marker:** A 8px solid circle using `primary`. 
*   **Layout:** The date should sit in the "gutter" to the left of the line using `label-md`, while the content sits to the right. This creates an asymmetrical, sophisticated flow.

### Buttons & Chips
*   **Primary Button:** `primary` background with `on-primary` text. `rounded-md` (0.375rem). No shadow.
*   **Secondary/Pill Tabs:** Use the "Pill" style (`rounded-full`). Unselected tabs should have no background; selected tabs use `primary-container` with `on-primary-container` text. This avoids the "heavy" button look in navigation.

### Inputs & Fields
*   **Style:** Minimalist underline or "ghost" box. On focus, the bottom border transitions to `primary` (#0053db). 
*   **Feedback:** Error states use `error` (#9f403d) but only for the text and a small 2px left-side accent bar, avoiding the "red box" trope.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place your hero text on the left with a massive empty gutter on the right. It feels confident.
*   **Use Mono-spacing for Data:** Use a monospace font (or Inter's tabular numbers) for dates, version numbers, and "Lines of Code" metrics to lean into the engineering aesthetic.
*   **Respect the "Breath":** If a section feels crowded, double the padding. This system relies on the "luxury of space."

### Don’t:
*   **Don't use 100% Black:** Always use `on-background` (#2b3438) for text to maintain a high-end "ink on paper" feel rather than "pixels on screen."
*   **Don't use Center-Alignment:** Keep content left-aligned. Center-alignment often feels like a template; left-alignment feels like a document.
*   **No Heavy Gradients:** Avoid "Instagram-style" vibrant gradients. Use only subtle tonal shifts within the blue family.