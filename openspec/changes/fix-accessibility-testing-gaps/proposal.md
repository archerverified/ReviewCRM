# Change: Fix Accessibility and Testing Gaps

## Why

QA assessment (2026-01-23) identified critical accessibility barriers affecting 15-20% of users and zero test coverage. The current implementation lacks WCAG AA compliance for modal focus management and input error association, creating legal liability and poor UX for keyboard/screen reader users.

## What Changes

### Accessibility Fixes
- **Modal Focus Trap**: Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, and focus restoration on close
- **Input ARIA Attributes**: Add `aria-invalid` and `aria-describedby` for error association with screen readers
- **Select ARIA Attributes**: Add `aria-invalid` and `aria-describedby` for error association

### Testing Infrastructure
- **Enable Test Suite**: Configure Jest to run existing 145 tests created during QA review
- **Verify Test Execution**: Ensure `npm test` runs successfully

### Non-Issues (Already Compliant)
- **FilterBar Dropdowns**: QA assessment incorrectly identified as hover-only. The FilterBar uses `@headlessui/react` Menu component which is already click-based and fully keyboard accessible. No changes needed.

## Impact

- **Affected Components**:
  - `src/components/ui/Modal.tsx` - Focus trap and ARIA attributes
  - `src/components/ui/Input.tsx` - ARIA error association
  - `src/components/ui/Select.tsx` - ARIA error association

- **Affected Specs**:
  - `ui-primitives` - Modified requirements for accessibility

- **Risk Level**: Low - Changes are additive and don't alter existing functionality

- **WCAG Compliance**: After implementation, components will meet WCAG 2.1 AA criteria:
  - 2.4.3 Focus Order
  - 2.4.7 Focus Visible
  - 1.3.1 Info and Relationships
  - 4.1.2 Name, Role, Value
