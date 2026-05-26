# Enterprise ERP Motion System - Refined

## Philosophy

This ERP dashboard follows **Bloomberg Terminal / SAP Fiori / Oracle ERP** standards:

- **80% Focus**: Layout, information hierarchy, financial readability
- **20% Focus**: Minimal motion polish
- **Zero**: Attention-seeking animations, pulse effects, glows, scaling

Motion is **functional, not decorative**.

---

## Core Principles

### 1. **Minimal & Functional**
- Motion serves readability and hierarchy
- No attention-seeking animations
- No pulse, glow, or scaling effects
- Subtle surface brighten on hover only

### 2. **Synchronized**
- Same timing: 150ms-180ms
- Same easing: executive cubic-bezier
- Unified hover behaviors

### 3. **Performance-First**
- GPU-friendly transforms only
- Instant progress animations (not cinematic)
- 60fps maintained

---

## Motion Variables

```css
/* Duration - Fast & Functional */
--motion-duration-fast: 150ms;
--motion-duration-base: 180ms;

/* Easing - Executive Standard */
--motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--motion-easing-executive: cubic-bezier(0.32, 0.08, 0.24, 1);

/* Elevations - Minimal */
--motion-elevation-xs: 1px;
--motion-elevation-sm: 2px;
```

---

## Allowed Utility Classes

### ✅ Hover Elevation (Minimal Only)
```html
<div class="hover-lift-xs">   <!-- 1px lift -->
<div class="hover-lift-sm">   <!-- 2px lift -->
```

### ✅ Synchronized Transitions
```html
<div class="transition-executive">       <!-- 180ms -->
<div class="transition-executive-fast">  <!-- 150ms -->
```

### ✅ Progress Animations (Instant)
```html
<div class="progress-fill" style="width: 75%">
```

---

## ❌ Removed (Not Enterprise ERP)

### Pulse Animations
- ❌ `pulse-subtle`
- ❌ `risk-pulse-critical`
- ❌ Any pulse/attention-seeking effects

**Reason**: ERP dashboards don't use pulse. Bloomberg/SAP don't pulse.

### Icon Scaling
- ❌ `icon-hover-scale`
- ❌ Any scale transforms on icons

**Allowed**: Opacity shift or brightness shift only.

### Glow Effects
- ❌ `hover-glow-blue/rose/amber/emerald`
- ❌ Gradient overlay fades
- ❌ Shadow glows

**Reason**: SaaS/startup UI pattern, not enterprise ERP.

### Excessive Elevation
- ❌ `hover-lift-md` (3px+)

**Reason**: Too much movement. Keep it minimal.

---

## Component Patterns

### KPI Cards
```tsx
// ✅ Correct
<article className="erp-kpi-card group">
  <svg className="transition-executive group-hover:opacity-80">
    {/* Icon - opacity shift only */}
  </svg>
</article>

// ❌ Wrong
<svg className="icon-hover-scale pulse-subtle">
```

### Table Rows
```tsx
// ✅ Correct
<tr className="erp-table-row group">
  <td className="transition-executive group-hover:text-blue-500">
    {/* Subtle color shift */}
  </td>
</tr>
```

### Progress Bars
```tsx
// ✅ Correct - Fast, not cinematic
<div className="progress-fill" style={{ width: `${pct}%` }} />

// ❌ Wrong - Too slow
<div className="transition-all duration-1000">
```

### Risk Cards
```tsx
// ✅ Correct - No pulse
<div className="transition-executive hover-lift-xs">
  {/* Subtle hover only */}
</div>

// ❌ Wrong - Attention-seeking
<div className="risk-pulse-critical hover-glow-rose">
```

---

## Priority Hierarchy

### 80% Effort: Information Architecture
1. Layout refinement
2. Information hierarchy
3. Financial readability
4. WBS table structure
5. Chart clarity
6. Risk architecture

### 20% Effort: Motion Polish
1. Subtle hover states
2. Smooth transitions
3. Minimal elevation

---

## Testing Checklist

- [ ] No pulse animations anywhere
- [ ] No icon scaling
- [ ] No glow effects
- [ ] Progress bars are instant (not cinematic)
- [ ] Hover feedback is subtle surface brighten only
- [ ] All timing synchronized (150-180ms)
- [ ] Dashboard feels like Bloomberg/SAP, not futuristic UI

---

## Success Criteria

Motion system is correct when:

1. **Barely noticeable** - Users don't see animations
2. **Functional** - Motion serves hierarchy, not decoration
3. **Fast** - Progress is instant, not cinematic
4. **Minimal** - Only hover lift and color shifts
5. **Bloomberg-like** - Operational density, not visual showcase

---

## Reference Standards

✅ **Follow**:
- Bloomberg Terminal
- SAP Fiori
- Oracle ERP
- Microsoft Dynamics

❌ **Avoid**:
- Startup SaaS dashboards
- Fintech flashy UI
- Crypto dashboards
- Futuristic UI showcases

---

## Motion Framework: LOCKED

**No further animation framework expansion allowed.**

Focus shifts to:
- Information architecture
- Financial readability
- Operational density
- Chart redesign
- Table structure
