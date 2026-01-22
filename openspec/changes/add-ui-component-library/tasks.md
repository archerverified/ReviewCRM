# Implementation Tasks

## 1. Dependency Installation
- [ ] 1.1 Install @headlessui/react for accessible Select component
- [ ] 1.2 Install clsx for conditional className utility
- [ ] 1.3 Install tailwind-merge for Tailwind class conflict resolution
- [ ] 1.4 Install sonner for toast notifications
- [ ] 1.5 Verify @types/papaparse is installed for TypeScript support
- [ ] 1.6 Run `npm install` to ensure all dependencies resolved

## 2. Utility Infrastructure
- [ ] 2.1 Create src/lib/utils.ts file
- [ ] 2.2 Implement cn() function combining clsx and twMerge
- [ ] 2.3 Add TypeScript type: `type ClassValue` from clsx
- [ ] 2.4 Test cn() utility with basic class merging cases
- [ ] 2.5 Verify cn() resolves Tailwind conflicts (e.g., px-4 + px-6 → px-6)

## 3. Button Component
- [ ] 3.1 Create src/components/ui/ directory
- [ ] 3.2 Create src/components/ui/Button.tsx file
- [ ] 3.3 Import ButtonHTMLAttributes, ReactNode, forwardRef from React
- [ ] 3.4 Import cn utility from @/lib/utils
- [ ] 3.5 Define ButtonProps interface extending ButtonHTMLAttributes
- [ ] 3.6 Add variant prop with 'primary' | 'secondary' | 'ghost' | 'danger' types
- [ ] 3.7 Add size prop with 'sm' | 'md' | 'lg' types
- [ ] 3.8 Add loading, leftIcon, rightIcon optional props
- [ ] 3.9 Implement Button component using forwardRef
- [ ] 3.10 Define baseStyles with font-medium, transition-colors, focus states
- [ ] 3.11 Define variantStyles object mapping variants to Tailwind classes
- [ ] 3.12 Define sizeStyles object mapping sizes to padding and text classes
- [ ] 3.13 Implement loading spinner SVG with animate-spin class
- [ ] 3.14 Conditionally render leftIcon with mr-2 spacing
- [ ] 3.15 Conditionally render rightIcon with ml-2 spacing
- [ ] 3.16 Set disabled={disabled || loading} to prevent interaction when loading
- [ ] 3.17 Add Button.displayName = 'Button' for React DevTools
- [ ] 3.18 Verify Button renders with all 4 variants correctly
- [ ] 3.19 Verify Button renders with all 3 sizes correctly
- [ ] 3.20 Test loading state shows spinner and disables button

## 4. Input Component
- [ ] 4.1 Create src/components/ui/Input.tsx file
- [ ] 4.2 Import InputHTMLAttributes, ReactNode, forwardRef from React
- [ ] 4.3 Import cn utility from @/lib/utils
- [ ] 4.4 Define InputProps interface extending InputHTMLAttributes
- [ ] 4.5 Add label, error, icon optional props
- [ ] 4.6 Implement Input component using forwardRef
- [ ] 4.7 Render label with text-sm font-medium text-gray-700 mb-1.5
- [ ] 4.8 Wrap input in relative div for absolute icon positioning
- [ ] 4.9 Render icon with absolute positioning (left-3 top-1/2 -translate-y-1/2)
- [ ] 4.10 Add pl-10 to input when icon is present
- [ ] 4.11 Define input classes: rounded-xl, border-black/10, focus:ring-2 focus:ring-blue-500
- [ ] 4.12 Add error state classes: border-red-500 focus:ring-red-500 when error present
- [ ] 4.13 Render error message with mt-1.5 text-sm text-red-600
- [ ] 4.14 Add disabled:opacity-50 disabled:cursor-not-allowed classes
- [ ] 4.15 Add Input.displayName = 'Input' for React DevTools
- [ ] 4.16 Verify Input renders with label correctly
- [ ] 4.17 Verify Input shows error state with red border and message
- [ ] 4.18 Test icon positioning with search icon example

## 5. Modal Component
- [ ] 5.1 Create src/components/ui/Modal.tsx file
- [ ] 5.2 Add 'use client' directive for Next.js client component
- [ ] 5.3 Import ReactNode, useEffect from React
- [ ] 5.4 Import createPortal from 'react-dom'
- [ ] 5.5 Import cn utility from @/lib/utils
- [ ] 5.6 Define ModalProps interface with isOpen, onClose, title, children, footer, size
- [ ] 5.7 Add size type: 'sm' | 'md' | 'lg' | 'xl' with default 'md'
- [ ] 5.8 Implement useEffect for body scroll lock when isOpen=true
- [ ] 5.9 Implement useEffect for Escape key listener calling onClose
- [ ] 5.10 Clean up scroll lock and event listener in useEffect return
- [ ] 5.11 Return null when isOpen=false (early return)
- [ ] 5.12 Define sizeStyles object mapping sizes to max-width classes
- [ ] 5.13 Render portal to document.body using createPortal
- [ ] 5.14 Create backdrop div with fixed inset-0 bg-black/50 and onClick={onClose}
- [ ] 5.15 Create modal container with centering (flex min-h-full items-center justify-center p-4)
- [ ] 5.16 Create modal content div with bg-white rounded-xl shadow-2xl and size class
- [ ] 5.17 Render header with title and close button (X icon)
- [ ] 5.18 Render children in content section with px-6 py-4
- [ ] 5.19 Conditionally render footer section with border-top if footer prop provided
- [ ] 5.20 Style footer with flex justify-end gap-3
- [ ] 5.21 Verify Modal renders with backdrop blur and center positioning
- [ ] 5.22 Test backdrop click closes modal
- [ ] 5.23 Test Escape key closes modal
- [ ] 5.24 Verify body scroll lock activates when modal opens

## 6. Select Component
- [ ] 6.1 Create src/components/ui/Select.tsx file
- [ ] 6.2 Add 'use client' directive for Next.js client component
- [ ] 6.3 Import Fragment from React
- [ ] 6.4 Import Listbox, Transition from '@headlessui/react'
- [ ] 6.5 Import cn utility from @/lib/utils
- [ ] 6.6 Define SelectOption interface with value and label strings
- [ ] 6.7 Define SelectProps interface with label, value, onChange, options, placeholder, error
- [ ] 6.8 Implement Select functional component
- [ ] 6.9 Find selectedOption from options array using value prop
- [ ] 6.10 Render optional label with text-sm font-medium text-gray-700 mb-1.5
- [ ] 6.11 Wrap in Listbox with value and onChange props
- [ ] 6.12 Create Listbox.Button with rounded-xl border styling
- [ ] 6.13 Display selectedOption.label or placeholder with gray-400 color when empty
- [ ] 6.14 Add chevron-down icon with pointer-events-none on right side
- [ ] 6.15 Add error state classes to button: border-red-500 when error present
- [ ] 6.16 Wrap Listbox.Options in Transition component with fade animation
- [ ] 6.17 Style Listbox.Options with absolute z-10 mt-1 rounded-xl shadow-lg
- [ ] 6.18 Set max-h-60 overflow-auto for scrollable dropdown
- [ ] 6.19 Map options to Listbox.Option elements with key={option.value}
- [ ] 6.20 Style active option with bg-blue-50 text-blue-600
- [ ] 6.21 Style selected option with font-medium
- [ ] 6.22 Render error message below dropdown with mt-1.5 text-sm text-red-600
- [ ] 6.23 Verify Select opens dropdown on click
- [ ] 6.24 Test keyboard navigation (arrow keys, Enter to select)
- [ ] 6.25 Verify selected option shows font-medium styling

## 7. Refactor ImportModal
- [ ] 7.1 Add import statements for Modal, Button, Select from ui/
- [ ] 7.2 Add import for toast from 'sonner'
- [ ] 7.3 Replace div.fixed.inset-0 wrapper with <Modal> component
- [ ] 7.4 Pass isOpen, onClose, title, size="lg" props to Modal
- [ ] 7.5 Remove manual header rendering (Modal handles it)
- [ ] 7.6 Move Cancel and Import buttons to footer prop
- [ ] 7.7 Replace button.clay-btn-primary with <Button variant="primary">
- [ ] 7.8 Replace button.clay-btn-secondary with <Button variant="secondary">
- [ ] 7.9 Add loading prop to Import button: <Button loading={importing}>
- [ ] 7.10 Replace HTML select elements in mapping grid with <Select> components
- [ ] 7.11 Create columnOptions array: headers.map(h => ({ value: h, label: h }))
- [ ] 7.12 Pass label, value, onChange, options props to each Select
- [ ] 7.13 Remove manual dropdown styling classes (Select handles it)
- [ ] 7.14 Replace success message with toast.success() call
- [ ] 7.15 Replace error handling with toast.error() calls
- [ ] 7.16 Update import success toast: `toast.success(\`Imported ${businesses.length} businesses successfully\`)`
- [ ] 7.17 Update parse error toast: `toast.error(\`CSV parse error: ${error.message}\`)`
- [ ] 7.18 Update import error toast: `toast.error(\`Import failed: ${error.message}\`)`
- [ ] 7.19 Remove manual modal backdrop and centering divs
- [ ] 7.20 Remove manual close button (Modal provides it)
- [ ] 7.21 Test CSV upload flow end-to-end
- [ ] 7.22 Verify column mapping dropdowns work correctly
- [ ] 7.23 Verify import shows progress and success toast

## 8. Refactor FilterBar
- [ ] 8.1 Add import statements for Input, Button from ui/
- [ ] 8.2 Replace search input HTML with <Input> component
- [ ] 8.3 Create search icon SVG component or inline SVG
- [ ] 8.4 Pass icon prop to Input: <Input icon={<SearchIcon />}>
- [ ] 8.5 Pass placeholder="Search businesses..." to Input
- [ ] 8.6 Pass value and onChange props to Input
- [ ] 8.7 Replace clear filters button with <Button variant="ghost" size="sm">
- [ ] 8.8 Keep <details> dropdowns unchanged (no Select component needed)
- [ ] 8.9 Remove clay-input className (Input component handles styling)
- [ ] 8.10 Remove clay-btn-secondary className from existing buttons
- [ ] 8.11 Test search input functionality
- [ ] 8.12 Test clear filters button
- [ ] 8.13 Verify filter dropdowns still work correctly

## 9. TypeScript Type Definitions
- [ ] 9.1 Verify all components have proper TypeScript interfaces
- [ ] 9.2 Ensure no 'any' types except in PapaParser callbacks
- [ ] 9.3 Verify forwardRef generic types are correct: `forwardRef<HTMLButtonElement, ButtonProps>`
- [ ] 9.4 Verify HTMLAttributes extension works for all native props
- [ ] 9.5 Run TypeScript compiler: `npx tsc --noEmit`
- [ ] 9.6 Fix any TypeScript errors reported

## 10. Clay Design System Compliance
- [ ] 10.1 Verify cream background color #F8F6F3 in globals.css or Tailwind config
- [ ] 10.2 Verify Inter font is loaded in layout.tsx
- [ ] 10.3 Check Button primary variant uses bg-black text-white
- [ ] 10.4 Check Button secondary variant uses border-2 border-black/10
- [ ] 10.5 Check Input uses rounded-xl not rounded-lg
- [ ] 10.6 Check Modal uses rounded-xl and shadow-2xl
- [ ] 10.7 Verify all components use 4px grid spacing (p-4, gap-4, space-y-4)
- [ ] 10.8 Check hover states use hover:bg-black/5 or hover:bg-blue-50
- [ ] 10.9 Verify focus states use focus:ring-2 focus:ring-blue-500
- [ ] 10.10 Visual review: Compare with PROMPT 2 specification screenshots/examples

## 11. Testing and Validation
- [ ] 11.1 Start dev server: `npm run dev`
- [ ] 11.2 Navigate to application in browser
- [ ] 11.3 Test Button component in isolation (all variants, sizes, loading state)
- [ ] 11.4 Test Input component (label, error, icon, focus states)
- [ ] 11.5 Test Modal component (open/close, backdrop, escape key, scroll lock)
- [ ] 11.6 Test Select component (dropdown, keyboard nav, selection)
- [ ] 11.7 Test CSV import workflow end-to-end:
  - [ ] Upload D7 CSV file
  - [ ] Verify column auto-detection
  - [ ] Preview first 3 rows
  - [ ] Adjust mapping if needed
  - [ ] Import 100+ rows
  - [ ] Verify progress bar
  - [ ] Verify success toast
- [ ] 11.8 Test FilterBar functionality:
  - [ ] Search input with debounce
  - [ ] Toggle pipeline stage filters
  - [ ] Toggle email status filters
  - [ ] Clear all filters
- [ ] 11.9 Verify no console errors or warnings
- [ ] 11.10 Run build: `npm run build` (ensure production build succeeds)
- [ ] 11.11 Test accessibility with keyboard navigation
- [ ] 11.12 Test focus management (tab order makes sense)

## 12. Documentation and Cleanup
- [ ] 12.1 Add JSDoc comments to component props if needed
- [ ] 12.2 Verify all imports use @/ path alias consistently
- [ ] 12.3 Remove any console.log statements added during development
- [ ] 12.4 Format code with Prettier or ESLint autofix
- [ ] 12.5 Update any relevant README files with component usage examples
- [ ] 12.6 Archive any unused old component code (if applicable)

## Validation Checklist

After completing all tasks, verify:
- [ ] All 4 UI primitive components exist and work correctly
- [ ] src/lib/utils.ts exports cn() function
- [ ] @headlessui/react, clsx, tailwind-merge, sonner installed
- [ ] ImportModal uses Modal, Button, Select primitives
- [ ] FilterBar uses Input, Button primitives
- [ ] No TypeScript 'any' types (except PapaParser callbacks)
- [ ] All components use forwardRef where needed (Button, Input)
- [ ] Clay design system colors exact match to spec
- [ ] All 19 pipeline stages available in FilterBar dropdown
- [ ] Pricing tier filter shows correct prices ($125/$110/$90)
- [ ] CSV import completes successfully with toast notifications
- [ ] No placeholder code or TODOs in any component
- [ ] Production build succeeds without errors
- [ ] Visual regression: UI looks consistent with current design
