# Change: Add UI Component Library and CSV Import Workflow

## Why

ReviewCRM currently has feature-specific components (BusinessGrid, FilterBar, ImportModal) but lacks a foundational design system with reusable UI primitives. This creates:

1. **Code duplication**: Each component reimplements buttons, inputs, and modals with inconsistent styling
2. **Design inconsistency**: No centralized source of truth for Clay design system implementation
3. **Poor developer experience**: Developers must write raw HTML + Tailwind classes instead of using composable primitives
4. **Maintenance burden**: Changes to core UI patterns require updates across multiple files

The PROMPT 2 specification mandates a complete UI component library following the Clay design system with exact color specifications (#F8F6F3 cream background), production-ready components with no placeholders, and TypeScript strict mode compliance.

## What Changes

This change introduces a foundational UI component library and refactors existing components to use it:

### New UI Primitives (src/components/ui/)
- **Button**: Polymorphic component with 4 variants (primary, secondary, ghost, danger), 3 sizes, loading states, icon support, forwardRef
- **Input**: Form input with label, error state, left icon support, accessible focus states, forwardRef
- **Modal**: Portal-rendered dialog with 4 sizes (sm/md/lg/xl), backdrop click-to-close, escape key handling, body scroll locking
- **Select**: Accessible dropdown using Headless UI Listbox, keyboard navigation, transition animations

### Utility Infrastructure
- **src/lib/utils.ts**: Tailwind class name merging utility (`cn()`) using clsx + tailwind-merge

### Refactored Components
- **ImportModal**: Replace raw HTML modal with new ui/Modal, ui/Button, ui/Select primitives
- **FilterBar**: Replace inline HTML with new ui/Input and ui/Button components

### Dependencies
- Add `@headlessui/react` for accessible Select component
- Add `clsx` and `tailwind-merge` for class name utilities
- Add `sonner` for toast notifications
- Ensure `@types/papaparse` is installed for TypeScript support

## Impact

### Affected Specs
- **NEW**: `ui-primitives` - Foundational UI component library specification
- **NEW**: `csv-import-workflow` - CSV import flow with field mapping and validation

### Affected Code
- **Created Files** (5):
  - `src/components/ui/Button.tsx` (112 lines)
  - `src/components/ui/Input.tsx` (78 lines)
  - `src/components/ui/Modal.tsx` (79 lines)
  - `src/components/ui/Select.tsx` (85 lines)
  - `src/lib/utils.ts` (6 lines)

- **Modified Files** (3):
  - `src/components/ImportModal.tsx` - Refactor to use new primitives (667→560 lines estimated)
  - `src/components/FilterBar.tsx` - Refactor to use new primitives (188→150 lines estimated)
  - `package.json` - Add 4 new dependencies

### Breaking Changes
**None** - This is purely additive. Existing components are refactored but maintain identical APIs and behavior.

### Migration Path
1. Install dependencies (npm install)
2. Create UI primitive components
3. Create utils.ts
4. Refactor ImportModal to use new components
5. Refactor FilterBar to use new components
6. Verify visual consistency and functionality

## Success Criteria

- [ ] All 4 UI primitive components created with complete implementations
- [ ] utils.ts exports working cn() function
- [ ] ImportModal uses Modal, Button, Select primitives (no raw HTML dialogs)
- [ ] FilterBar uses Input and Button primitives
- [ ] Clay design system colors match specification exactly
- [ ] All components use forwardRef where appropriate
- [ ] TypeScript strict mode passes with no 'any' types (except PapaParser callbacks)
- [ ] No placeholder code or TODOs in components
- [ ] Visual regression test: UI looks identical to current implementation
- [ ] Functional test: CSV import workflow completes successfully
- [ ] Functional test: Filter operations work correctly
