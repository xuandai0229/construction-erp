# TODO — PREMIUM EXECUTIVE ERP DASHBOARD UI

## Step 1 — Add executive depth tokens + surface system
- [x] Update `app/globals.css`

  - add refined shadow hierarchy + focus ring tokens
  - add subtle “top accent” border helpers for card headers
  - tune table hover + zebra opacity
  - ensure transitions are consistent and conservative

## Step 2 — KPI Cards: premium identity + hierarchy
- [x] Update `app/components/KPISection.tsx`
  - stronger per-type accent identity (top accent + icon container + border)
  - subtle executive gradients (very low opacity)
  - improved label/value/sub rhythm (less generic)
  - add consistent hover lift + border/overlay transition

## Step 3 — Sidebar: active rail glow + enterprise navigation
- [x] Update `app/components/Sidebar.tsx`
  - implement active rail indicator (brand rail + glow)
  - upgrade active typography + contrast
  - replace inline hover jank with class-based conservative transitions

## Step 4 — Tables: reduce emptiness + improve scan readability
- [ ] Update `app/components/WBSTable.tsx`
  - improve sticky header styling and separation
  - enhance row hover with subtle overlay + border
  - parent/child hierarchy: stronger left accent line + readability
  - emphasize footer totals with stronger typography and background tint

## Step 5 — Charts: alive but serious
- [ ] Update `app/components/ChartSection.tsx`
  - thicken lines slightly
  - add subtle gradient area fills
  - improve legend/axis typography/spacing
  - ensure SVG boxes don’t create empty zones

## Step 6 — Regression check
- [ ] Run lint/typecheck/tests if available
- [ ] Quick manual render validation of dashboard (no broken CSS/classes)

