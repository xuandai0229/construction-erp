# ENTERPRISE MOTION SYSTEM - REFERENCE GUIDE

## Overview
The ERP Dashboard implements a **subtle, synchronized enterprise-grade motion system** inspired by SAP Fiori, Bloomberg Terminal, and Oracle Cloud. All animations are designed to be nearly imperceptible while creating a premium, executive-feeling experience.

---

## Motion Timing Standards

All transitions use one of these standardized durations:

| Token | Duration | Use Case |
|-------|----------|----------|
| `--motion-duration-instant` | 100ms | Micro-interactions, state changes |
| `--motion-duration-quick` | 150ms | Fast transitions |
| `--motion-duration-standard` | **180ms** | Primary choice (KPI hover, table rows, buttons) |
| `--motion-duration-smooth` | 220ms | Modals, overlays, major state transitions |
| `--motion-duration-long` | 300ms | Slow reveals, sustained animations |

**Default**: Use `--motion-duration-standard` (180ms) for all component interactions.

---

## Easing Functions

### Primary: Enterprise Exit
```css
--motion-ease-out: cubic-bezier(0.4, 0, 0.2, 1)
```
- **Smoothness**: Starts fast, decelerates smoothly
- **Feel**: Professional, settled
- **Use**: KPI hover, table rows, buttons, all primary interactions

### Alternative: In-Out Blend
```css
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```
- Same as ease-out (most professional)
- Use interchangeably for consistency

### Gentle Accent
```css
--motion-ease-gentle: cubic-bezier(0.34, 1.56, 0.64, 1)
```
- **Smoothness**: Slightly bouncier for emphasis
- **Use**: Rarely; only for special reveals or emphasis

---

## Component Motion Specifications

### 1. KPI Cards

**Hover State**:
- Transform: `translateY(-3px)` (elevate)
- Shadow: `--shadow-hover` (increase depth)
- Border: Shift to `var(--brand)` color
- Duration: `--motion-duration-standard`
- Easing: `--motion-ease-out`

**CSS**:
```css
.kpi-card {
  transition: transform var(--motion-duration-standard) var(--motion-ease-out),
              box-shadow var(--motion-duration-standard) var(--motion-ease-out),
              border-color var(--motion-duration-standard) var(--motion-ease-out);
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
  border-color: var(--brand);
}
```

**Intent**: Subtle elevation suggests executive authority without being flashy.

---

### 2. Table Rows

**Hover State**:
- Background: Lighten to `#F8FAFC`
- Left accent bar: Reveal 3px blue bar with fade-in
- Duration: `--motion-duration-standard`

**CSS**:
```css
.erp-table tbody tr {
  position: relative;
  transition: background-color var(--motion-duration-standard) var(--motion-ease-out);
}

.erp-table tbody tr::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--brand);
  opacity: 0;
  transition: opacity var(--motion-duration-standard) var(--motion-ease-out);
}

.erp-table tbody tr:hover::before {
  opacity: 1;
}

.erp-table tbody tr:hover td {
  background-color: #F8FAFC;
}
```

**Intent**: The accent bar reveals meaning ("selected/active row") without aggressive highlighting.

---

### 3. Buttons

**Hover State**:
- Background: Darken shade
- Transform: `translateY(-2px)` (gentle lift)
- Shadow: Increase to `0 6px 16px rgba(37, 99, 235, 0.25)`
- Duration: `--motion-duration-standard`

**Active/Press State**:
- Transform: Return to `translateY(0px)`
- Shadow: Reduce to `0 2px 8px rgba(37, 99, 235, 0.15)`
- Duration: Instant (0ms)

**CSS**:
```css
.btn {
  transition: all var(--motion-duration-standard) var(--motion-ease-out);
}

.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
}

.btn-primary:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}
```

**Intent**: Tactile feedback (lift on hover, press on active) creates premium feel.

---

### 4. Risk & Alert Cards

**Severity-Based Pulse**:

#### HIGH Severity
- **Animation**: `risk-pulse-high` (3-second cycle)
- **Effect**: Subtle red shadow pulse
- **Intensity**: Very subtle (2-4px outer glow)

```css
.risk-card.severity-high {
  animation: risk-pulse-high 3s ease-in-out infinite;
}

@keyframes risk-pulse-high {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}
```

#### MEDIUM Severity
- **Animation**: `risk-pulse-medium` (3.5-second cycle)
- **Effect**: Amber pulse, slightly slower

#### LOW Severity
- **Animation**: None
- **Effect**: Static presentation

**Intent**: Severity level communicated through animation frequency, not intensity.

---

### 5. Input Fields & Forms

**Focus State**:
- Border: Change to `var(--brand)`
- Shadow: Add `0 0 0 2px var(--brand-light)` glow
- Duration: `--motion-duration-standard`

**CSS**:
```css
.erp-input {
  transition: border-color var(--motion-duration-standard) var(--motion-ease-out),
              box-shadow var(--motion-duration-standard) var(--motion-ease-out);
}

.erp-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-light);
}
```

---

### 6. Modals

**Entry Animation**:
- Start: `opacity: 0; transform: translateY(10px);`
- End: `opacity: 1; transform: translateY(0);`
- Duration: `--motion-duration-smooth` (220ms)
- Easing: `--motion-ease-out`

**CSS**:
```css
.erp-modal {
  animation: modalEnter var(--motion-duration-smooth) var(--motion-ease-out);
}

@keyframes modalEnter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Status Badges

All status indicators use synchronized timing:

```css
.status-badge {
  transition: all var(--motion-duration-standard) var(--motion-ease-out);
}

.status-badge.healthy {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-badge.at-risk {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.status-badge.critical {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
```

---

## Chart Animations (Ready for Implementation)

Keyframes are pre-defined for future chart integration:

### Line Draw Animation
```css
@keyframes chart-line-draw {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}
```

### Tooltip Fade-In
```css
@keyframes tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Data Point Highlight
```css
@keyframes data-point-highlight {
  0% {
    r: 3px;
    opacity: 0.6;
  }
  50% {
    r: 5px;
    opacity: 1;
  }
  100% {
    r: 3px;
    opacity: 0.6;
  }
}
```

---

## Dark Mode & Light Mode Consistency

**Important**: The motion system uses CSS variables and is **100% consistent across both themes**.

- All durations, easing, and transforms are theme-agnostic
- Color shifts (border glow, shadows) are adapted per theme but timing is identical
- Test all hover/interaction states in both dark and light modes

---

## Performance Optimization

All animations are **GPU-accelerated** using only:
1. **Transform** (translate, rotate, scale)
2. **Opacity** (fade)
3. **Shadow** transitions (no blur animation)

**What NOT to do**:
- ❌ Animate `width`, `height`, `left`, `top` (causes layout thrashing)
- ❌ Animate `blur()` or `filter` (expensive)
- ❌ Use `keyframes` with expensive properties
- ❌ Animate too many elements simultaneously

**Result**: Smooth 60fps motion on all devices.

---

## Implementation Guidelines

### For Component Developers

1. **Always use motion timing variables**:
   ```css
   transition: all var(--motion-duration-standard) var(--motion-ease-out);
   ```

2. **Never hardcode timing**:
   ```css
   /* ❌ Don't do this */
   transition: all 0.2s ease;
   
   /* ✅ Do this instead */
   transition: all var(--motion-duration-standard) var(--motion-ease-out);
   ```

3. **For new components**:
   - Start with `--motion-duration-standard` (180ms)
   - Use `--motion-ease-out` for all easing
   - Test hover/focus states
   - Verify GPU-friendly (transform, opacity, shadow only)

4. **Test checklist**:
   - [ ] Hover state is smooth
   - [ ] No layout shift
   - [ ] Works in light mode
   - [ ] Works in dark mode
   - [ ] 60fps (no jank)
   - [ ] Feels premium (not flashy)

---

## Visual Reference

### Premium Executive Feel ✓
- Subtle elevation (2-4px)
- Smooth timing (180ms)
- Professional easing (ease-out)
- Nearly imperceptible

### To Avoid ✗
- Large transforms (zoom >1.05)
- Bouncy easing
- Slow timing (>300ms default)
- Visible ripples or glows
- Layout shifts

---

## CSS Variables Summary

### Motion Timing
- `--motion-duration-instant` (100ms)
- `--motion-duration-quick` (150ms)
- `--motion-duration-standard` (180ms) **← Default**
- `--motion-duration-smooth` (220ms)
- `--motion-duration-long` (300ms)

### Easing
- `--motion-ease-out` **← Default**
- `--motion-ease-in-out`
- `--motion-ease-gentle`

### Shadows (for elevation)
- `--shadow-elevation-rest`
- `--shadow-elevation-hover`
- `--shadow-elevation-active`

### Border Glow
- `--border-glow-rest`
- `--border-glow-hover`
- `--border-glow-active`

---

## Examples

### Example 1: New Interactive Element
```tsx
// Component
<div className="my-interactive-card">
  <h3>Data Card</h3>
  <p>Hover me for smooth motion</p>
</div>

// CSS
.my-interactive-card {
  transition: all var(--motion-duration-standard) var(--motion-ease-out);
  cursor: pointer;
}

.my-interactive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
```

### Example 2: Status Indicator
```tsx
<div className={`risk-card severity-${risk.level}`}>
  <h3>{risk.name}</h3>
</div>

// CSS
.risk-card {
  transition: all var(--motion-duration-standard) var(--motion-ease-out);
}

.risk-card.severity-high {
  animation: risk-pulse-high 3s ease-in-out infinite;
}
```

---

## Testing Motion

### Manual Testing Checklist
- [ ] Hover all KPI cards → smooth elevation
- [ ] Hover all table rows → accent bar appears
- [ ] Hover all buttons → lift + shadow
- [ ] Focus all inputs → border + glow
- [ ] Open modals → fade-in smooth
- [ ] Check dark mode → same motion feel
- [ ] Check light mode → same motion feel

### Performance Testing
- Open DevTools Performance tab
- Record user interaction
- Verify: No dropped frames, 60fps maintained

---

## Q&A

**Q: Why 180ms instead of 200ms or 150ms?**
A: 180ms is the sweet spot for enterprise applications—fast enough to feel responsive, slow enough to feel intentional and premium.

**Q: Can I use different easing for some components?**
A: Avoid it. Consistency is key to premium feel. Stick to `--motion-ease-out` for 99% of cases.

**Q: What if a component needs a custom duration?**
A: Use a valid motion timing token. If none fit, add a new token to `:root` in `app/globals.css` with a clear name (e.g., `--motion-duration-emphasis: 250ms`).

**Q: How do I animate chart data points?**
A: Use the pre-defined keyframes (`chart-line-draw`, `data-point-highlight`). Apply as `animation: chart-line-draw 0.6s var(--motion-ease-out);`

**Q: Is animation necessary?**
A: No, but it significantly improves perception of quality and responsiveness. Even subtle motion is better than static UI.

---

## Version
- **Created**: 2026-05-19
- **Status**: Active
- **Maintained by**: Enterprise Motion System Task
