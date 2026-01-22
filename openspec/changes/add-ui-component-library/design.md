# Design: UI Component Library and CSV Import Workflow

## Context

ReviewCRM is a Next.js 14 application built for solo operator usage in the Google review removal business. The current implementation has three feature-rich components (BusinessGrid, FilterBar, ImportModal) that directly embed UI patterns without abstraction. This change establishes a foundational component library following the Clay design system aesthetic.

**Constraints:**
- Must maintain visual consistency with existing Clay-themed interface
- TypeScript strict mode required
- No runtime performance degradation
- Single-user application (no multi-tenancy concerns)
- Must support forwardRef for form library compatibility (future React Hook Form integration)

**Stakeholders:**
- Solo operator (Archer Wolfe) - needs reliable CSV import and filtering
- Future VA support - will use same UI for reply handling

## Goals / Non-Goals

### Goals
- Establish reusable UI primitive component library (Button, Input, Modal, Select)
- Implement exact Clay design system specifications from PROMPT 2
- Create composable components with TypeScript strict mode compliance
- Refactor existing components to use new primitives (reduce duplication)
- Support accessibility (keyboard navigation, focus management, screen readers)

### Non-Goals
- NOT replacing AG Grid (BusinessGrid keeps ag-grid-react)
- NOT implementing form validation library (just UI primitives)
- NOT adding authentication/authorization (single-user app)
- NOT creating Storybook or component documentation (YAGNI for solo operator)
- NOT implementing dark mode (Clay design is light-themed)

## Decisions

### Decision 1: Headless UI for Select Component
**Rationale:** PROMPT 2 specification explicitly requires `@headlessui/react` Listbox for Select component.

**Why Headless UI:**
- Provides accessibility out-of-the-box (ARIA attributes, keyboard navigation)
- Unstyled primitives allow full Tailwind customization
- Small bundle size (~15KB gzipped)
- Battle-tested by Tailwind Labs
- Zero breaking changes since v1.0

**Alternatives Considered:**
- Radix UI: Heavier bundle, over-engineered for simple select needs
- react-select: Too opinionated with styles, harder to customize to Clay aesthetic
- HTML `<select>`: Poor UX, no custom styling, inconsistent across browsers
- Custom implementation: Reinventing accessibility is error-prone

**Decision:** Use @headlessui/react Listbox as specified

### Decision 2: clsx + tailwind-merge for Class Name Utility
**Rationale:** Industry-standard pattern for dynamic Tailwind class composition.

**Why This Combination:**
- `clsx`: Fastest conditional class name builder (1KB)
- `tailwind-merge`: Intelligently resolves Tailwind class conflicts (e.g., `px-4 px-6` → `px-6`)
- Together they form the `cn()` utility used by shadcn/ui and other popular libraries
- Prevents class precedence bugs when combining className props

**Alternatives Considered:**
- `classnames` package: Older, slightly slower than clsx
- Manual string concatenation: Error-prone, doesn't handle conflicts
- Only clsx (no tailwind-merge): Would have `bg-black bg-white` conflicts

**Decision:** Implement `cn()` utility using clsx + tailwind-merge

### Decision 3: Portal Rendering for Modal Component
**Rationale:** Modals must render at document root to avoid z-index and overflow issues.

**Why React Portal:**
- Prevents parent container styles from affecting modal positioning
- Ensures backdrop covers entire viewport
- Standard React pattern (React.createPortal)
- No dependencies beyond React

**Implementation Details:**
- Portal target: `document.body`
- Body scroll lock: Set `overflow: hidden` when modal open
- Cleanup: useEffect return function removes scroll lock
- Escape key handler: addEventListener with cleanup

**Alternatives Considered:**
- Render in-place: Would inherit parent z-index and overflow constraints
- Third-party modal library: Unnecessary for simple use case

**Decision:** Use React.createPortal to render modals at document.body

### Decision 4: forwardRef for Form Compatibility
**Rationale:** Future integration with React Hook Form or other form libraries requires ref forwarding.

**Why forwardRef:**
- Allows parent components to access underlying DOM elements
- Required for form libraries to programmatically focus inputs
- Standard React pattern for reusable components
- Zero runtime cost

**Components Requiring forwardRef:**
- Button: For focus management in forms
- Input: For form library integration (register, focus, validation)

**Components NOT Requiring forwardRef:**
- Modal: Manages its own internal refs
- Select: Headless UI handles refs internally

**Decision:** Use forwardRef for Button and Input components

### Decision 5: Keep HTML `<details>` for FilterBar Dropdowns
**Rationale:** FilterBar dropdowns don't need Select component - HTML details element is simpler.

**Why HTML details:**
- No JavaScript required for open/close behavior
- Native browser implementation is fast
- CSS-only hover trigger works well for filter menus
- Checkboxes inside details are standard pattern
- Avoids unnecessary Headless UI overhead

**When to Use Select vs details:**
- Select: Single-value selection from list (e.g., column mapping in ImportModal)
- details: Multi-select checkboxes (e.g., pipeline stage filter)

**Decision:** FilterBar keeps `<details>` dropdowns, uses new Input and Button components

### Decision 6: Sonner for Toast Notifications
**Rationale:** PROMPT 2 specification requires toast notifications for import success/error.

**Why Sonner:**
- Lightweight (3KB gzipped)
- Beautiful default styling that matches Clay aesthetic
- Simple API: `toast.success()`, `toast.error()`
- Auto-dismiss with configurable duration
- Positioned at top-right by default

**Alternatives Considered:**
- react-hot-toast: Similar but heavier bundle
- Custom toast implementation: Over-engineering for simple notifications
- Alert() or console.log(): Poor UX

**Decision:** Use sonner for toast notifications

## Component API Design

### Button Component
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
```

**Variant Mapping:**
- `primary`: Black background (Clay CTA buttons)
- `secondary`: White with border (Clay secondary actions)
- `ghost`: Transparent with blue text (Clay tertiary actions)
- `danger`: Red background (destructive actions)

### Input Component
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}
```

**Layout:**
- Label above input (not floating label)
- Icon positioned absolutely on left
- Error message below input in red

### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Size Mapping:**
- `sm`: 28rem (448px) - small confirmations
- `md`: 42rem (672px) - default forms
- `lg`: 56rem (896px) - CSV import with preview table
- `xl`: 72rem (1152px) - wide content

### Select Component
```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}
```

## Risks / Trade-offs

### Risk: Bundle Size Increase
**Mitigation:**
- @headlessui/react: 15KB gzipped (acceptable for accessibility benefits)
- clsx + tailwind-merge: 3KB combined
- sonner: 3KB
- **Total increase: ~21KB** - negligible for modern web apps

### Risk: Breaking Changes During Refactor
**Mitigation:**
- Keep existing component APIs identical
- Only change internal implementation
- Test CSV import flow end-to-end after refactor
- Test filter operations after refactor

### Risk: Over-Engineering for Single User
**Counter:**
- These components will be reused across future features (campaigns, metrics dashboard)
- Solo operator benefits from consistent UX
- Component library pays for itself after 3+ uses

### Trade-off: Headless UI Dependency
**Accepted:**
- Adds dependency but provides accessibility
- 15KB is worth not reinventing ARIA patterns
- Maintained by Tailwind Labs (stable, long-term support)

## Migration Plan

### Step 1: Install Dependencies (2 minutes)
```bash
npm install @headlessui/react clsx tailwind-merge sonner
```

### Step 2: Create UI Primitives (30 minutes)
1. Create `src/lib/utils.ts` with cn() function
2. Create `src/components/ui/Button.tsx` (copy from PROMPT 2 spec)
3. Create `src/components/ui/Input.tsx` (copy from PROMPT 2 spec)
4. Create `src/components/ui/Modal.tsx` (copy from PROMPT 2 spec)
5. Create `src/components/ui/Select.tsx` (copy from PROMPT 2 spec)

### Step 3: Refactor ImportModal (15 minutes)
1. Import Modal, Button, Select from ui/
2. Replace div.fixed.inset-0 with <Modal>
3. Replace HTML select elements with <Select>
4. Replace clay-btn-primary with <Button variant="primary">
5. Add toast.success() and toast.error() calls
6. Test CSV upload → preview → import flow

### Step 4: Refactor FilterBar (10 minutes)
1. Import Input, Button from ui/
2. Replace search input HTML with <Input icon={searchIcon}>
3. Replace clear filters button with <Button variant="ghost">
4. Keep `<details>` dropdowns unchanged
5. Test filter operations work correctly

### Step 5: Verification (5 minutes)
- Run TypeScript compiler: `npm run build`
- Start dev server: `npm run dev`
- Test CSV import: Upload sample D7 CSV → verify preview → import
- Test filters: Search, toggle stage filters, clear filters
- Visual check: Compare before/after screenshots

### Rollback Plan
If refactor causes issues:
1. Git revert commit
2. All changes are in separate files, easy to undo
3. No database migrations involved

## Open Questions

None - PROMPT 2 specification is comprehensive and prescriptive. All implementation details are provided.
