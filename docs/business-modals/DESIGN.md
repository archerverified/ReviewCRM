# Business Modals - UI/UX Design Specification

## Design Philosophy

These modals follow a **user-centered design** approach with emphasis on:

1. **Clarity** - Information is organized and scannable
2. **Safety** - Destructive actions require confirmation
3. **Efficiency** - Common actions are accessible and quick
4. **Consistency** - Matches existing design system patterns

---

## Visual Design Language

### Color Palette

```
Primary Blue:    #2563eb  (blue-600)
Text Primary:    #111827  (gray-900)
Text Secondary:  #6b7280  (gray-500)
Background:      #f9fafb  (gray-50)
Border:          #e5e7eb  (gray-200)
Success:         #10b981  (green-600)
Warning:         #f59e0b  (amber-600)
Danger:          #dc2626  (red-600)
```

### Typography Scale

```
Heading XL:      text-2xl font-bold    (24px)
Heading L:       text-xl font-semibold (20px)
Heading M:       text-lg font-semibold (18px)
Heading S:       text-sm font-semibold (14px)
Body:            text-sm               (14px)
Caption:         text-xs               (12px)
```

### Spacing System

```
xs:  0.25rem  (4px)
sm:  0.5rem   (8px)
md:  1rem     (16px)
lg:  1.5rem   (24px)
xl:  2rem     (32px)
```

---

## Business Detail Modal - Design Specs

### Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ HEADER (white bg, border-b)                       [X]    │ │
│  │ Business Name - text-xl font-semibold                    │ │
│  │ 24px padding                                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SCROLLABLE CONTENT AREA (24px padding)                   │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ Section: Contact & Location (gray-50 bg)           │ │ │
│  │  │ 16px padding, rounded-xl                           │ │ │
│  │  │                                                    │ │ │
│  │  │ Contact Name       Email (copy icon)              │ │ │
│  │  │ Phone (copy icon)  Location                       │ │ │
│  │  │ Industry           Website (link)                 │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  24px gap                                                │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ Section: Review Metrics (gray-50 bg)              │ │ │
│  │  │                                                    │ │ │
│  │  │ Current Rating: 3.8 ★    [Progress bars for      │ │ │
│  │  │ Total Reviews: 127       each star rating]       │ │ │
│  │  │ Projected: 4.2 ★                                  │ │ │
│  │  │                                                    │ │ │
│  │  │ ┌────────────────────────────────────────────┐    │ │ │
│  │  │ │ Media Reviews Found (amber-50 bg)          │    │ │ │
│  │  │ │ 15 total (10 one-star + 5 two-star)        │    │ │ │
│  │  │ └────────────────────────────────────────────┘    │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  [Additional sections follow same pattern...]            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ FOOTER (white bg, border-t, 16px padding)                │ │
│  │                          [Close] [Edit] [Delete]         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Header
- **Height**: Auto (min 64px)
- **Background**: White
- **Border**: Bottom 1px gray-200
- **Padding**: 24px horizontal, 16px vertical
- **Title**: text-xl font-semibold text-gray-900
- **Close Button**: 24x24px, gray-400 hover:gray-600

#### Content Sections
- **Background**: gray-50
- **Border Radius**: 12px (rounded-xl)
- **Padding**: 16px
- **Gap Between**: 24px
- **Section Title**: text-sm font-semibold text-gray-900

#### Information Grid
- **Layout**: 2 columns on md+ breakpoints
- **Gap**: 16px
- **Label**: text-xs text-gray-500
- **Value**: text-sm text-gray-900

#### Status Badges
```
┌─────────────────────┐
│ •  Lead Scraped     │  Background: color with 20% opacity
│                     │  Text: Full color
│                     │  Padding: 8px horizontal, 4px vertical
│                     │  Border Radius: 9999px (full)
│                     │  Font: text-xs font-medium
└─────────────────────┘
```

#### Star Rating Display
```
┌──────────────────────────────────┐
│ 3.8 ★  Large, bold text          │  Rating: text-lg font-bold
│                                  │  Star: text-yellow-400
└──────────────────────────────────┘
```

#### Star Breakdown Bars
```
5★  ████████████████████░░  45   Width: percentage of total
4★  ██████████░░░░░░░░░░░  30   Height: 8px (h-2)
3★  ████░░░░░░░░░░░░░░░░░  12   Background: gray-200
2★  ██░░░░░░░░░░░░░░░░░░░   8   Fill: yellow-400
1★  ████████░░░░░░░░░░░░░  32   Rounded: full
```

---

## Delete Confirmation Modal - Design Specs

### Layout Structure

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Delete Businesses              [X]     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ⚠️  WARNING (red-50 bg, red-200 border)│ │
│  │                                        │ │
│  │ This action cannot be undone           │ │
│  │                                        │ │
│  │ You are about to permanently delete    │ │
│  │ 3 businesses from your database.       │ │
│  │ All associated data will be lost.      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Businesses to be deleted (3):               │
│  ┌────────────────────────────────────────┐ │
│  │┌──────────────────────────────────────┐│ │
│  ││ Business Name 1              $5,000  ││ │
│  ││ City, State • 5 media reviews        ││ │
│  │├──────────────────────────────────────┤│ │
│  ││ Business Name 2              $2,500  ││ │
│  ││ City, State • 2 media reviews        ││ │
│  │└──────────────────────────────────────┘│ │
│  │ Max height: 256px (scrollable)         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Impact Summary (gray-50 bg)            │ │
│  │                                        │ │
│  │ Total: 3    Value: $7,500              │ │
│  │ Media: 7    Messages: 2                │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │            [Cancel] [Delete 3 Businesses]│
│  └────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

### Component Specifications

#### Warning Box
- **Background**: red-50
- **Border**: 1px red-200
- **Border Radius**: 12px (rounded-xl)
- **Padding**: 16px
- **Icon**: 24x24px red-600 (exclamation triangle)
- **Title**: text-sm font-semibold text-red-900
- **Body**: text-sm text-red-700

#### Business List
- **Max Height**: 256px (max-h-64)
- **Overflow**: scroll-y auto
- **Background**: gray-50
- **Border**: 1px gray-200
- **Border Radius**: 12px
- **Item Padding**: 12px horizontal, 12px vertical
- **Item Border**: Bottom 1px gray-200
- **Business Name**: text-sm font-medium text-gray-900
- **Details**: text-xs text-gray-500

#### Impact Summary (Multi-delete only)
- **Background**: gray-50
- **Border**: 1px gray-200
- **Border Radius**: 12px
- **Padding**: 16px
- **Grid**: 2 columns
- **Label**: text-xs text-gray-500
- **Value**: text-lg font-bold text-gray-900

---

## Interaction States

### Hover States

```css
/* Button hover */
background: blue-700 (from blue-600)

/* Row hover */
background: gray-50 (from white)

/* Link hover */
color: blue-700 (from blue-600)
text-decoration: underline

/* Icon hover */
color: gray-600 (from gray-400)
```

### Focus States

```css
/* All interactive elements */
outline: 2px solid blue-500
outline-offset: 2px
border-radius: matches element
```

### Loading States

```css
/* Disabled button */
opacity: 0.5
cursor: not-allowed

/* Loading spinner */
animation: spin 1s linear infinite
color: current (inherits button text color)
```

---

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layouts
- Reduced padding (16px → 12px)
- Smaller font sizes where appropriate
- Stack buttons vertically in footer

### Tablet (768px - 1024px)
- 2 column grid for info fields
- Standard padding (16px)
- Horizontal button layout

### Desktop (> 1024px)
- Modal max-width: 896px (xl size)
- 2-3 column grids where appropriate
- Full feature set visible

---

## Animation & Transitions

### Modal Entry/Exit
```css
/* Backdrop fade */
transition: opacity 200ms ease-in-out
from: opacity-0
to: opacity-100

/* Modal slide & fade */
transition: opacity 200ms, transform 200ms
from: opacity-0, scale-95
to: opacity-100, scale-100
```

### Micro-interactions
```css
/* Button press */
transition: all 150ms ease-in-out
active: scale-98

/* Color transitions */
transition: color 150ms, background-color 150ms

/* Progress bars */
transition: width 500ms ease-out
```

---

## Accessibility Features

### Keyboard Navigation Flow

```
1. Modal opens → Focus moves to first interactive element
2. Tab → Cycles through focusable elements
3. Shift+Tab → Cycles backward
4. ESC → Closes modal
5. Modal closes → Focus returns to trigger element
```

### Screen Reader Announcements

```html
<!-- Modal container -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

<!-- Status badges -->
<span role="status" aria-live="polite">Email verified</span>

<!-- Warning messages -->
<div role="alert" aria-live="assertive">This action cannot be undone</div>

<!-- Loading states -->
<button aria-busy="true">Deleting...</button>
```

### Color Contrast Ratios

All text meets WCAG AA standards:
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:1 minimum
- UI components: 3:1 minimum

---

## Design Tokens

### Shadows

```css
shadow-sm:  0 1px 2px rgba(0,0,0,0.05)
shadow:     0 1px 3px rgba(0,0,0,0.1)
shadow-md:  0 4px 6px rgba(0,0,0,0.1)
shadow-lg:  0 10px 15px rgba(0,0,0,0.1)
shadow-xl:  0 20px 25px rgba(0,0,0,0.1)
shadow-2xl: 0 25px 50px rgba(0,0,0,0.25)
```

### Border Radius

```css
rounded-lg:  8px
rounded-xl:  12px
rounded-full: 9999px
```

### Icon Sizes

```css
Small:  16px (w-4 h-4)
Medium: 20px (w-5 h-5)
Large:  24px (w-6 h-6)
XLarge: 32px (w-8 h-8)
```

---

## Component Hierarchy

```
BusinessDetailModal
├── Modal (base component)
│   ├── Header
│   │   ├── Title
│   │   └── Close Button
│   ├── Content
│   │   ├── Contact Section
│   │   │   └── InfoField components
│   │   ├── Review Metrics Section
│   │   │   ├── Star Display
│   │   │   ├── Star Breakdown components
│   │   │   └── Media Reviews Highlight
│   │   ├── Pricing Section
│   │   ├── Pipeline Section
│   │   │   ├── Stage Badge
│   │   │   ├── Stage Dropdown
│   │   │   └── Status Badges
│   │   ├── Message Section (conditional)
│   │   ├── Notes Section (conditional)
│   │   └── Metadata Section
│   └── Footer
│       └── Action Buttons

DeleteConfirmationModal
├── Modal (base component)
│   ├── Header
│   │   ├── Title
│   │   └── Close Button
│   ├── Content
│   │   ├── Warning Box
│   │   ├── Business List (scrollable)
│   │   └── Impact Summary (conditional)
│   └── Footer
│       └── Action Buttons
```

---

## Usage Examples

### Opening Business Detail Modal
```typescript
// From table row click
<tr onClick={(e) => handleRowClick(business, e)}>

// Programmatically
setSelectedBusiness(business);
setIsDetailModalOpen(true);
```

### Opening Delete Modal
```typescript
// Single delete
setSelectedIds(new Set([businessId]));
setIsDeleteModalOpen(true);

// Bulk delete (from toolbar)
// selectedIds already set via checkboxes
setIsDeleteModalOpen(true);
```

---

## Performance Considerations

1. **Lazy Loading**: Modals only render when `isOpen={true}`
2. **Portal Rendering**: Uses React portals to avoid z-index issues
3. **Event Delegation**: Click outside handled at modal level
4. **Debouncing**: Stage changes debounced to avoid rapid API calls
5. **Optimistic Updates**: UI updates before server confirmation

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

All features gracefully degrade in older browsers.

---

This design specification ensures consistency, accessibility, and excellent user experience across the ReviewCRM application.
