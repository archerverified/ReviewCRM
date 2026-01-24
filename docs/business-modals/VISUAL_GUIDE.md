# Business Modals - Visual UI Guide

## Component States & Variations

This guide shows all visual states and variations of the Business modals.

---

## Business Detail Modal

### State 1: Basic Information View

```
┌────────────────────────────────────────────────────────────────┐
│  Acme Dental Care                                         [X]  │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📍 Contact & Location                                    │  │
│  │                                                          │  │
│  │  Contact Name      Email                                │  │
│  │  Dr. Sarah Johnson sarah@acme.com [📋]                  │  │
│  │                                                          │  │
│  │  Phone             Location                             │  │
│  │  (555) 123-4567 [📋] Seattle, WA                        │  │
│  │                                                          │  │
│  │  Industry          Website                              │  │
│  │  Dental Practice   acmedental.com [🔗]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⭐ Review Metrics                                        │  │
│  │                                                          │  │
│  │  Current Rating    Star Breakdown                       │  │
│  │  3.8 ★             5★ ████████████░░░░  45              │  │
│  │  Total: 127        4★ ██████████░░░░░░  30              │  │
│  │                    3★ ████░░░░░░░░░░░░  12              │  │
│  │  Projected         2★ ██░░░░░░░░░░░░░░   8              │  │
│  │  4.2 ★             1★ ████████░░░░░░░░  32              │  │
│  │                                                          │  │
│  │  ⚠️ Media Reviews Found                                 │  │
│  │  15 total (10 one-star + 5 two-star)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  [More sections...]                                            │
├────────────────────────────────────────────────────────────────┤
│                              [Close] [Edit] [Delete]           │
└────────────────────────────────────────────────────────────────┘
```

---

### State 2: No Media Reviews

```
┌────────────────────────────────────────────────────────────────┐
│  Perfect Smile Dentistry                                  [X]  │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⭐ Review Metrics                                        │  │
│  │                                                          │  │
│  │  Current Rating    Star Breakdown                       │  │
│  │  4.5 ★             5★ ████████████████░░  67            │  │
│  │  Total: 89         4★ ████████░░░░░░░░░  18            │  │
│  │                    3★ ██░░░░░░░░░░░░░░░   3            │  │
│  │  Projected         2★ ░░░░░░░░░░░░░░░░░   1            │  │
│  │  N/A               1★ ░░░░░░░░░░░░░░░░░   0            │  │
│  │                                                          │  │
│  │  ℹ️ No media reviews found                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### State 3: Missing Contact Information

```
┌────────────────────────────────────────────────────────────────┐
│  Main Street Clinic                                       [X]  │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📍 Contact & Location                                    │  │
│  │                                                          │  │
│  │  Contact Name      Email                                │  │
│  │  Not provided      contact@mainstreet.com [📋]          │  │
│  │                                                          │  │
│  │  Phone             Location                             │  │
│  │  Not provided      Portland, OR                         │  │
│  │                                                          │  │
│  │  Industry          Website                              │  │
│  │  Medical Clinic    Not provided                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### State 4: Pipeline Section with Stage Dropdown

```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎯 Pipeline & Status                                     │  │
│  │                                                          │  │
│  │  Current Stage                                           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │ Positive Reply  │  │ [▼] Positive Reply           │  │  │
│  │  │   (green bg)    │  │     Awaiting Audit           │  │  │
│  │  └─────────────────┘  │     Audit Complete           │  │  │
│  │                       │     Proposal Sent            │  │  │
│  │  Email Verification   │     Follow-Up 1              │  │  │
│  │  ┌──────┐           └──────────────────────────────┘  │  │
│  │  │ Good │ (green badge)                                │  │
│  │  └──────┘                                               │  │
│  │                                                          │  │
│  │  Email Outreach                                          │  │
│  │  ┌─────────┐                                            │  │
│  │  │ Replied │ (green badge)                              │  │
│  │  └─────────┘                                             │  │
│  │                                                          │  │
│  │  Last Contacted                                          │  │
│  │  January 15, 2026                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### State 5: With Outreach Message

```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 💬 Outreach Message                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Hi Dr. Johnson,                                    │  │  │
│  │  │                                                    │  │  │
│  │  │ I noticed Acme Dental Care has 15 reviews with   │  │  │
│  │  │ photos or videos that are affecting your 3.8     │  │  │
│  │  │ star rating.                                      │  │  │
│  │  │                                                    │  │  │
│  │  │ Our service can help remove these and boost your │  │  │
│  │  │ rating to a projected 4.2 stars - that's a game  │  │  │
│  │  │ changer for local search visibility.             │  │  │
│  │  │                                                    │  │  │
│  │  │ Would you be interested in a free audit?          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### State 6: Pricing Section

```
┌────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 💰 Pricing & Value                                       │  │
│  │                                                          │  │
│  │  Pricing Tier      Price/Review      Total Value        │  │
│  │  ┌──────────┐     $125             $1,875               │  │
│  │  │ Standard │                      (15 reviews)          │  │
│  │  └──────────┘                                            │  │
│  │                                                          │  │
│  │  ℹ️ Standard: 1-24 reviews @ $125 each                  │  │
│  │     Volume: 25-49 reviews @ $110 each                    │  │
│  │     Enterprise: 50+ reviews @ $90 each                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

### State 7: Footer Action Buttons

```
┌────────────────────────────────────────────────────────────────┐
│  [... modal content ...]                                       │
├────────────────────────────────────────────────────────────────┤
│                              [Close] [Edit] [Delete]           │
└────────────────────────────────────────────────────────────────┘
     Gray ghost btn  Gray secondary  Red danger btn

┌────────────────────────────────────────────────────────────────┐
│                              [Close] [Edit]                    │
└────────────────────────────────────────────────────────────────┘
     When onDelete is not provided

┌────────────────────────────────────────────────────────────────┐
│                              [Close]                           │
└────────────────────────────────────────────────────────────────┘
     Minimal version (view only)
```

---

## Delete Confirmation Modal

### State 1: Single Business Delete

```
┌──────────────────────────────────────────────────────────────┐
│  Delete Businesses                                      [X]  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⚠️  This action cannot be undone                      │  │
│  │                                                        │  │
│  │ You are about to permanently delete this business     │  │
│  │ from your database. All associated data including     │  │
│  │ notes, outreach messages, and pipeline history will   │  │
│  │ be lost.                                               │  │
│  └────────────────────────────────────────────────────────┘  │
│  (Red background, red border)                                │
│                                                              │
│  Business to be deleted:                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────────────────────────────────┐ │  │
│  │ │ Acme Dental Care                          $1,875   │ │  │
│  │ │ Seattle, WA • 15 media reviews                     │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│  (Gray-50 background, gray-200 border, scrollable)           │
├──────────────────────────────────────────────────────────────┤
│                        [Cancel] [Delete 1 Business]          │
└──────────────────────────────────────────────────────────────┘
                         Gray btn  Red btn
```

---

### State 2: Bulk Delete (3 businesses)

```
┌──────────────────────────────────────────────────────────────┐
│  Delete Businesses                                      [X]  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⚠️  This action cannot be undone                      │  │
│  │                                                        │  │
│  │ You are about to permanently delete 3 businesses      │  │
│  │ from your database. All associated data will be lost. │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Businesses to be deleted (3):                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────────────────────────────────┐ │  │
│  │ │ Acme Dental Care                          $1,875   │ │  │
│  │ │ Seattle, WA • 15 media reviews                     │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Perfect Smile Dentistry                      $0    │ │  │
│  │ │ Portland, OR • 0 media reviews                     │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Main Street Clinic                        $3,300   │ │  │
│  │ │ Portland, OR • 12 media reviews                    │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Impact Summary                                         │  │
│  │                                                        │  │
│  │  Total Businesses    Total Value                      │  │
│  │  3                   $5,175                            │  │
│  │                                                        │  │
│  │  Media Reviews       With Messages                    │  │
│  │  27                  2                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│  (Gray-50 background, 2-column grid)                         │
├──────────────────────────────────────────────────────────────┤
│                      [Cancel] [Delete 3 Businesses]          │
└──────────────────────────────────────────────────────────────┘
```

---

### State 3: Loading State

```
┌──────────────────────────────────────────────────────────────┐
│  Delete Businesses                                      [X]  │
├──────────────────────────────────────────────────────────────┤
│  ⚠️ Warning message...                                       │
│                                                              │
│  Businesses to be deleted (5):                               │
│  [List of businesses...]                                     │
│                                                              │
│  Impact Summary...                                           │
├──────────────────────────────────────────────────────────────┤
│                 [Cancel]  [⌛ Deleting... ]                  │
└──────────────────────────────────────────────────────────────┘
                 Disabled    Spinner + text (disabled)
```

---

### State 4: Many Businesses (Scrollable)

```
┌──────────────────────────────────────────────────────────────┐
│  Delete Businesses                                      [X]  │
├──────────────────────────────────────────────────────────────┤
│  ⚠️ Warning...                                               │
│                                                              │
│  Businesses to be deleted (15):                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────────────────────────────────┐ │  │
│  │ │ Business 1                            $1,875       │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Business 2                            $2,500       │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Business 3                            $3,300       │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Business 4                            $1,250       │ │  │
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ Business 5                            $4,500       │ │ ← Scroll
│  │ ├────────────────────────────────────────────────────┤ │  │
│  │ │ ... 10 more businesses ...                         │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│  max-h-64 overflow-y-auto                                    │
│                                                              │
│  Impact Summary:                                             │
│  Total: 15  Value: $32,500  Media: 87  Messages: 12         │
├──────────────────────────────────────────────────────────────┤
│                     [Cancel] [Delete 15 Businesses]          │
└──────────────────────────────────────────────────────────────┘
```

---

## Bulk Actions Toolbar States

### State 1: No Selection

```
┌────────────────────────────────────────────────────────────────┐
│  Businesses                                    [Import CSV]    │
│  Manage your business leads and pipeline                      │
└────────────────────────────────────────────────────────────────┘

Table displayed normally, no toolbar
```

---

### State 2: Selection Active

```
┌────────────────────────────────────────────────────────────────┐
│  Businesses                                    [Import CSV]    │
│  Manage your business leads and pipeline                      │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔵 3 businesses selected    [Clear selection]           │  │
│  │                                                          │  │
│  │              [Export] [Change Stage] [Delete Selected]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Blue-50 background, blue-200 border                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Table Checkbox States

### State 1: None Selected

```
Table Header:
┌───┬──────────────┬──────────┬─────────┬────────┬─────────┐
│ ☐ │ Business     │ Location │ Reviews │ Media  │ Value   │
├───┼──────────────┼──────────┼─────────┼────────┼─────────┤
│ ☐ │ Acme Dental  │ Seattle  │ 3.8 ★   │   15   │ $1,875  │
│ ☐ │ Perfect...   │ Portland │ 4.5 ★   │    0   │    $0   │
│ ☐ │ Main St...   │ Portland │ 3.2 ★   │   12   │ $3,300  │
└───┴──────────────┴──────────┴─────────┴────────┴─────────┘
```

---

### State 2: Some Selected

```
Table Header:
┌───┬──────────────┬──────────┬─────────┬────────┬─────────┐
│ ⊟ │ Business     │ Location │ Reviews │ Media  │ Value   │  ← Indeterminate
├───┼──────────────┼──────────┼─────────┼────────┼─────────┤
│ ☑ │ Acme Dental  │ Seattle  │ 3.8 ★   │   15   │ $1,875  │  ← Checked
│ ☐ │ Perfect...   │ Portland │ 4.5 ★   │    0   │    $0   │
│ ☑ │ Main St...   │ Portland │ 3.2 ★   │   12   │ $3,300  │  ← Checked
└───┴──────────────┴──────────┴─────────┴────────┴─────────┘
```

---

### State 3: All Selected

```
Table Header:
┌───┬──────────────┬──────────┬─────────┬────────┬─────────┐
│ ☑ │ Business     │ Location │ Reviews │ Media  │ Value   │  ← All checked
├───┼──────────────┼──────────┼─────────┼────────┼─────────┤
│ ☑ │ Acme Dental  │ Seattle  │ 3.8 ★   │   15   │ $1,875  │
│ ☑ │ Perfect...   │ Portland │ 4.5 ★   │    0   │    $0   │
│ ☑ │ Main St...   │ Portland │ 3.2 ★   │   12   │ $3,300  │
└───┴──────────────┴──────────┴─────────┴────────┴─────────┘
```

---

## Hover & Focus States

### Row Hover

```
Normal row:
│ ☐ │ Acme Dental  │ Seattle  │ 3.8 ★   │   15   │ $1,875  │
     White background

Hovered row:
│ ☐ │ Acme Dental  │ Seattle  │ 3.8 ★   │   15   │ $1,875  │
     Gray-50 background, cursor: pointer
```

---

### Button Focus

```
Normal button:
[Delete Selected]
Blue-600 bg, white text

Focused button:
[Delete Selected]
Blue-600 bg, white text
+ Blue-500 focus ring (2px, offset 2px)
```

---

### Input Focus

```
Normal checkbox:
☐ Gray-300 border

Focused checkbox:
☐ Blue-500 focus ring + gray-300 border
```

---

## Status Badge Variations

### Email Verification Badges

```
┌───────────┐  ┌──────┐  ┌────────┐  ┌──────┐
│Unverified │  │ Good │  │ Risky  │  │ Bad  │
└───────────┘  └──────┘  └────────┘  └──────┘
 Gray-100/700  Green     Yellow      Red
```

---

### Email Outreach Badges

```
┌──────────┐  ┌──────┐  ┌────────┐  ┌─────────┐  ┌─────────┐
│Not Sent  │  │ Sent │  │ Opened │  │ Clicked │  │ Replied │
└──────────┘  └──────┘  └────────┘  └─────────┘  └─────────┘
 Gray-100     Blue      Purple       Indigo       Green

┌─────────┐  ┌──────────────┐
│ Bounced │  │ Unsubscribed │
└─────────┘  └──────────────┘
 Red          Orange
```

---

### Pipeline Stage Badges

```
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│Lead Scraped  │  │Email Verified  │  │Positive Reply│
└──────────────┘  └────────────────┘  └──────────────┘
 Gray-400          Gray-500           Green-600

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Deal Closed   │  │Lost Opp.     │  │Do Not Contact│
└──────────────┘  └──────────────┘  └──────────────┘
 Green-600         Red-600           Red-600
```

---

## Responsive Breakpoints

### Desktop (> 1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  Business Details                                              │
│                                                                │
│  ┌────────────────────┐  ┌────────────────────┐               │
│  │ Contact Name       │  │ Email              │               │
│  │ Dr. Sarah Johnson  │  │ sarah@acme.com     │               │
│  └────────────────────┘  └────────────────────┘               │
│                                                                │
│  ┌────────────────────┐  ┌────────────────────┐               │
│  │ Phone              │  │ Location           │               │
│  │ (555) 123-4567     │  │ Seattle, WA        │               │
│  └────────────────────┘  └────────────────────┘               │
└────────────────────────────────────────────────────────────────┘
Two-column grid (grid-cols-2)
```

---

### Mobile (< 768px)

```
┌────────────────────────────────┐
│  Business Details              │
│                                │
│  ┌──────────────────────────┐  │
│  │ Contact Name             │  │
│  │ Dr. Sarah Johnson        │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Email                    │  │
│  │ sarah@acme.com           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Phone                    │  │
│  │ (555) 123-4567           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Location                 │  │
│  │ Seattle, WA              │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
Single column (grid-cols-1)
```

---

## Animation States

### Modal Open Animation

```
Frame 1 (0ms):
Backdrop opacity: 0
Modal opacity: 0, scale: 95%

Frame 2 (100ms):
Backdrop opacity: 50%
Modal opacity: 50%, scale: 97.5%

Frame 3 (200ms):
Backdrop opacity: 100%
Modal opacity: 100%, scale: 100%
```

---

### Modal Close Animation

```
Frame 1 (0ms):
Backdrop opacity: 100%
Modal opacity: 100%, scale: 100%

Frame 2 (100ms):
Backdrop opacity: 50%
Modal opacity: 50%, scale: 97.5%

Frame 3 (200ms):
Backdrop opacity: 0
Modal opacity: 0, scale: 95%
Modal unmounts
```

---

### Button Press Animation

```
Normal state:
[Delete]  scale: 100%

Active (pressed):
[Delete]  scale: 98%
          transition: 150ms
```

---

This visual guide provides a comprehensive view of all UI states, variations, and responsive behaviors in the Business modals. Use it as a reference for design consistency and implementation.
