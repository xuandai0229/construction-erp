# TODO - Enterprise ERP Motion System

- [ ] Step 1: Update `app/globals.css` with a single synchronized motion system
  - [ ] Add global tokens: duration (180–220ms preferred), easing enterprise-style
  - [ ] Add utility classes for hover/motion (only transform/opacity/border/background/box-shadow)
  - [ ] Normalize existing transitions to avoid `transition-all`
  - [ ] Remove/disable any infinite/bounce/pulse animations
  - [ ] Ensure shadow language is unified
  - [ ] Add prefers-reduced-motion

- [ ] Step 2: `app/components/KPISection.tsx`
  - [ ] Remove all `scale()` on hover
  - [ ] Replace transition-all/duration-300 usage with allowed properties + synchronized timing
  - [ ] Ensure icon glow opacity <= ~0.08 and use subtle translateY <= -2px only

- [ ] [ ] Step 3: `app/components/ChartSection.tsx`
  - [ ] Remove long duration transitions (e.g., duration-1000)
  - [ ] Use stable executive-feel motion only (stroke/opacity subtle)
  - [ ] Reduce drop-shadow intensity to match shadow system

- [ ] Step 4: `app/components/DebtPanel.tsx`
  - [ ] Shorten progress bar animation to global duration and only animate width via transitions
  - [ ] Keep glow opacity very low / remove any flashy effects

- [ ] Step 5: `app/components/CostTable.tsx`
  - [ ] Eliminate `transition-all`
  - [ ] Table row hover: only subtle brighten (~2–4%) + optional left accent indicator
  - [ ] Add unified hover timing/easing

- [ ] Step 6: `app/components/wbs/WBSTable.tsx`
  - [ ] Remove `animate-pulse` usage (especially severity)
  - [ ] Replace with subtle, synchronized severity indicators
  - [ ] Ensure row hover brightening is mild and shadow/border consistent

- [ ] Step 7: Verification
  - [ ] Run lint/build/tests
  - [ ] Manual hover checks for KPI, tables, charts in both light/dark modes
  - [ ] Confirm no infinite/bounce/pulse/flashy motion remains

