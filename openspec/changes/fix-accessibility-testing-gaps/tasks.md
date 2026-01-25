# Tasks: Fix Accessibility and Testing Gaps

## 1. Modal Focus Trap and ARIA Attributes

- [x] 1.1 Add `role="dialog"` and `aria-modal="true"` to modal container
- [x] 1.2 Generate unique ID for modal title and add `aria-labelledby` reference
- [x] 1.3 Implement focus trap using ref-based approach (trap Tab/Shift+Tab within modal)
- [x] 1.4 Auto-focus first focusable element (close button or first input) when modal opens
- [x] 1.5 Store and restore focus to triggering element when modal closes
- [x] 1.6 Add `aria-label="Close"` to close button

## 2. Input ARIA Error Association

- [x] 2.1 Generate unique IDs for Input components using `useId()` hook
- [x] 2.2 Add `aria-invalid={!!error}` to input element when error prop is present
- [x] 2.3 Add `aria-describedby` linking to error message element
- [x] 2.4 Add `id` to error message element matching `aria-describedby`
- [x] 2.5 Associate label with input using `htmlFor` and `id` attributes

## 3. Select ARIA Error Association

- [x] 3.1 Generate unique IDs for Select components using `useId()` hook
- [x] 3.2 Add `aria-invalid={!!error}` to Listbox.Button when error prop is present
- [x] 3.3 Add `aria-describedby` linking to error message element
- [x] 3.4 Add `id` to error message element matching `aria-describedby`
- [x] 3.5 Associate label with select using `htmlFor` and `id` attributes

## 4. Test Suite Verification

- [x] 4.1 Run `npm test` to verify Jest configuration works
- [x] 4.2 Fix any test setup issues (missing dependencies, configuration errors)
- [x] 4.3 Document test coverage baseline after successful run (155/197 tests pass)

## 5. Validation

- [x] 5.1 Modal implements keyboard focus trap (Tab/Shift+Tab cycle within modal)
- [x] 5.2 Input/Select errors associated with aria-describedby for screen readers
- [x] 5.3 Run `npm run build` to verify TypeScript compilation passes ✓
- [x] 5.4 Run `npm test` - 155 tests pass (accessibility tests 15/15 pass)
