# Design: Accessibility and Testing Fixes

## Context

ReviewCRM underwent a QA assessment that identified accessibility gaps in UI components. This change addresses the critical findings without over-engineering. The fixes follow established patterns from WCAG 2.1 AA guidelines.

**Constraints:**
- Must maintain visual consistency (no layout changes)
- TypeScript strict mode compliance
- No runtime performance degradation
- Minimal code changes (additive only)

## Goals / Non-Goals

### Goals
- Meet WCAG 2.1 AA compliance for modal and form inputs
- Enable focus trap in Modal component
- Associate error messages with inputs for screen readers
- Verify test infrastructure is operational

### Non-Goals
- NOT rewriting entire component library
- NOT adding comprehensive ARIA landmarks (out of scope)
- NOT implementing automated accessibility testing (future work)
- NOT fixing FilterBar (already accessible via Headless UI Menu)

## Decisions

### Decision 1: Focus Trap Implementation
**Approach:** Manual ref-based focus trap instead of third-party library.

**Why:**
- Only one modal component needs focus trap
- Libraries like `focus-trap-react` add ~5KB for one use case
- Simple implementation: track focusable elements, intercept Tab/Shift+Tab

**Implementation:**
```typescript
const getFocusableElements = (container: HTMLElement) => {
  return container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
};
```

**Alternative Considered:**
- `focus-trap-react`: Overkill for single modal, adds dependency

### Decision 2: useId() for ARIA ID Generation
**Approach:** Use React 18's built-in `useId()` hook for unique IDs.

**Why:**
- Built into React 18 (already using React 18.2)
- SSR-safe (consistent IDs between server and client)
- No external dependencies
- Automatically generates unique IDs per component instance

**Example:**
```typescript
const id = useId();
const errorId = `${id}-error`;
const inputId = `${id}-input`;
```

**Alternative Considered:**
- `uuid()`: Over-engineered, not SSR-safe
- Counter-based IDs: Not SSR-safe, potential conflicts

### Decision 3: Focus Restoration on Modal Close
**Approach:** Store `document.activeElement` on open, restore on close.

**Why:**
- Standard WCAG pattern for dialogs
- Maintains user's context after modal interaction
- Simple to implement with useRef

**Implementation:**
```typescript
const previousActiveElement = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (isOpen) {
    previousActiveElement.current = document.activeElement as HTMLElement;
    // Auto-focus first focusable element
  }
  return () => {
    previousActiveElement.current?.focus();
  };
}, [isOpen]);
```

### Decision 4: FilterBar - No Changes Needed
**Rationale:** QA assessment was incorrect about hover-only dropdowns.

**Evidence:**
- FilterBar uses `@headlessui/react` Menu component
- `Menu.Button` opens on click, not hover
- Keyboard navigation works: Enter/Space to open, Arrow keys to navigate
- Already WCAG compliant via Headless UI

**Action:** Document this in proposal as non-issue.

## Risks / Trade-offs

### Risk: Focus Trap Edge Cases
**Mitigation:**
- Test with multiple modals (should not occur in current app)
- Test with dynamically added content (use MutationObserver if needed)
- Test with disabled elements

### Trade-off: Manual Focus Trap vs Library
**Accepted:**
- Slightly more code to maintain
- But avoids 5KB dependency for one component
- Easy to swap in library later if issues arise

## Migration Plan

### Step 1: Modal Fixes (15 minutes)
1. Add ARIA attributes to modal container
2. Implement focus trap with Tab interception
3. Add focus restoration logic

### Step 2: Input Fixes (5 minutes)
1. Add `useId()` for unique IDs
2. Add ARIA attributes for error association
3. Link label to input

### Step 3: Select Fixes (5 minutes)
1. Add `useId()` for unique IDs
2. Add ARIA attributes for error association
3. Link label to select

### Step 4: Test Verification (5 minutes)
1. Run `npm test`
2. Fix any issues
3. Document baseline

### Rollback Plan
- All changes are in-place modifications to existing files
- Git revert single commit
- No database or API changes

## Open Questions

None - requirements are well-defined by WCAG 2.1 AA guidelines.
