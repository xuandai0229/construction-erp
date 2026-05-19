# Enterprise Motion System Documentation

## Overview

This ERP dashboard implements a **subtle, synchronized, enterprise-grade motion system** inspired by premium enterprise applications like SAP Fiori, Bloomberg Terminal, and Oracle Cloud ERP.

## Core Principles

### 1. **Subtle & Premium**
- Animations are barely noticeable but make the dashboard feel alive
- No flashy, gaming-style, or crypto dashboard effects
- Executive-grade feeling: professional, refined, sophisticated

### 2. **Synchronized**
- Same timing across all components
- Same easing curves throughout
- Unified hover behaviors
- Consistent animation language

### 3. **Performance-First**
- GPU-friendly transforms and opacity
- Smooth 60fps animations
- No layout thrashing
- Optimized for production use

---

## Motion Variables

All motion timing is centralized in `globals.css`:

```css
/* Duration */
--motion-duration-instant: 100ms;
--motion-duration-fast: 150ms;
--motion-duration-base: 180ms;
--motion-duration-smooth: 220ms;
--motion-duration-slow: 280ms;

/* Easing Curves */
--motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);      /* Material ease-out */
--motion-easing-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Gentle curve */
--motion-easing-executive: cubic-bezier(0.32, 0.08, 0.24, 1); /* Premium feel */

/* Elevations */
--motion-elevation-xs: 1px;
--motion-elevation-sm: 2px;
--motion-elevation-md: 3px;
--motion-elevation-lg: 4px;

/* Glow Intensities */
--glow-subtle: 0 0 12px -3px;
--glow-medium: 0 0 16px -2px;
--glow-emphasis: 0 0 20px -1px;
```

---

## Utility Classes

### Hover Elevation
```html
<div class="hover-lift-xs">   <!-- 1px lift -->
<div class="hover-lift-sm">   <!-- 2px lift -->
<div class="hover-lift-md">   <!-- 3px lift -->
```

### Subtle Glow Effects
```html
<div class="hover-glow-blue">
<div class="hover-glow-emerald">
<div class="hover-glow-rose">
<div class="hover-glow-amber">
```

### Icon Animations
```html
<svg class="icon-hover-scale">  <!-- Scales to 1.08 on hover -->
```

### Synchronized Transitions
```html
<div class="transition-executive">       <!-- Base 180ms -->
<div class="transition-executive-fast">  <!-- Fast 150ms -->
<div class="transition-executive-smooth"> <!-- Smooth 220ms -->
```

### Progress Animations
```html
<div class="progress-fill" style="width: 75%">  <!-- Smooth width transition -->
```

### Pulse Effects
```html
<span class="pulse-subtle">  <!-- Extremely subtle pulse for indicators -->
```

### Risk Alerts
```html
<div class="risk-pulse-critical">  <!-- Subtle pulse for critical alerts only -->
```

---

## Component Patterns

### KPI Cards

**Behavior:**
- Subtle 2px elevation on hover
- Border brightens slightly
- Icon scales to 1.08
- Gradient overlay fades in
- All synchronized at 180ms

**Implementation:**
```tsx
<article className="erp-kpi-card group">
  <div className="icon-hover-scale transition-executive">
    {/* Icon */}
  </div>
  <div className="transition-executive">
    {/* Content */}
  </div>
</article>
```

### Table Rows

**Behavior:**
- Background brightens on hover
- Left accent bar appears (2px blue)
- Text colors shift to blue
- All cells transition together
- 150ms fast transition

**Implementation:**
```tsx
<tr className="erp-table-row group">
  <td className="transition-executive group-hover:text-blue-500">
    {/* Cell content */}
  </td>
</tr>
```

### Buttons

**Behavior:**
- Subtle 1px lift on hover
- Brightness increases 5%
- Press feedback: scale(0.98)
- Tactile executive feeling

**Implementation:**
```tsx
<button className="erp-btn hover-lift-xs">
  Action
</button>
```

### Charts

**Behavior:**
- Smooth data transitions
- Progress bars animate with easing
- Tooltip fades in/out
- Crosshair smooth movement

**Implementation:**
```tsx
<div className="progress-fill" style={{ width: `${percentage}%` }} />
```

### Risk Cards

**Behavior:**
- **CRITICAL**: Subtle pulse animation (2.5s cycle)
- **WARNING**: Hover glow amber
- **INFO**: Hover glow blue
- Expand/collapse with smooth height transition
- Details fade in on expand

**Implementation:**
```tsx
<div className={`
  transition-executive 
  hover-lift-xs 
  ${severity === 'CRITICAL' ? 'risk-pulse-critical' : ''}
  ${severity === 'WARNING' ? 'hover-glow-amber' : ''}
`}>
  {/* Risk content */}
</div>
```

---

## Theme Synchronization

**CRITICAL:** All animations work identically in both dark and light modes.

- Same timing
- Same easing
- Same hover behaviors
- Same motion language

Only colors change between themes, never motion characteristics.

---

## Performance Guidelines

### ✅ DO USE:
- `transform: translateY()` for elevation
- `opacity` for fades
- `will-change: transform` for hover elements
- CSS variables for consistent timing

### ❌ AVOID:
- `margin` or `padding` animations
- `width`/`height` without `overflow: hidden`
- Excessive `blur()` filters
- Layout-triggering properties

---

## Animation Timing Reference

| Use Case | Duration | Easing | Class |
|----------|----------|--------|-------|
| Table row hover | 150ms | standard | `transition-executive-fast` |
| Card hover | 180ms | executive | `transition-executive` |
| Button press | 100ms | executive | `transition-executive` |
| Progress bar | 280ms | executive | `progress-fill` |
| Modal entrance | 220ms | executive | `modal-entrance` |
| Risk pulse | 2500ms | gentle | `risk-pulse-critical` |

---

## Testing Checklist

- [ ] All hover states are synchronized
- [ ] No animation feels "flashy" or "gaming-style"
- [ ] Dark and light modes have identical motion
- [ ] 60fps maintained on all interactions
- [ ] Animations feel premium and executive-grade
- [ ] No component has mismatched timing
- [ ] Progress bars animate smoothly
- [ ] Table rows have unified hover behavior
- [ ] Buttons have tactile feedback
- [ ] Risk alerts pulse subtly (critical only)

---

## Examples

### Before (Inconsistent):
```tsx
// ❌ Different timings, no synchronization
<div className="transition-all duration-300">
<div className="transition-colors duration-200">
<div className="hover:scale-110 duration-500">
```

### After (Synchronized):
```tsx
// ✅ Unified motion system
<div className="transition-executive">
<div className="transition-executive hover-lift-sm">
<div className="icon-hover-scale transition-executive">
```

---

## Maintenance

When adding new components:

1. **Use existing utility classes** instead of inline transitions
2. **Match the timing** of similar components
3. **Test in both themes** to ensure synchronization
4. **Keep it subtle** - if users notice the animation, it's too much
5. **Use CSS variables** for all timing and easing

---

## Success Criteria

The motion system is successful when:

1. Dashboard feels **alive** but not **animated**
2. Users barely notice individual animations
3. Everything feels **smooth** and **premium**
4. Motion is **synchronized** across all components
5. Performance stays at **60fps**
6. Both themes have **identical** motion behavior

---

## References

Inspired by:
- SAP Fiori Design System
- Bloomberg Terminal UX
- Oracle Cloud ERP
- Apple enterprise motion guidelines
- Material Design (subtle variant)

**NOT inspired by:**
- Startup SaaS flashy animations
- Fintech overload effects
- Crypto dashboard motion
- Gaming UI animations
- Cyberpunk aesthetics
