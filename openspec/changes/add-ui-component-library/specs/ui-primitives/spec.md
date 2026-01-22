# UI Primitives Specification

## ADDED Requirements

### Requirement: Button Component
The system SHALL provide a polymorphic Button component that supports multiple visual variants, sizes, loading states, and icon composition with proper TypeScript typing and ref forwarding.

#### Scenario: Primary button with default size
- **WHEN** developer renders `<Button variant="primary">Save</Button>`
- **THEN** button displays with black background, white text, medium size, and rounded-xl corners

#### Scenario: Secondary button with left icon
- **WHEN** developer renders `<Button variant="secondary" leftIcon={<Icon />}>Cancel</Button>`
- **THEN** button displays with white background, border, icon on left with 0.5rem spacing

#### Scenario: Loading state disables interaction
- **WHEN** developer renders `<Button loading={true}>Submit</Button>`
- **THEN** button shows spinner animation, is disabled, and cannot be clicked

#### Scenario: Small danger button
- **WHEN** developer renders `<Button variant="danger" size="sm">Delete</Button>`
- **THEN** button displays with red background, white text, small padding (text-sm px-3 py-1.5)

#### Scenario: Ghost button for tertiary actions
- **WHEN** developer renders `<Button variant="ghost">Learn More</Button>`
- **THEN** button displays with transparent background, blue text, blue background on hover

#### Scenario: Ref forwarding for focus management
- **WHEN** developer passes `ref` prop to Button component
- **THEN** ref is forwarded to underlying HTML button element for programmatic focus

#### Scenario: Custom className merging
- **WHEN** developer renders `<Button className="mt-4">Click</Button>`
- **THEN** custom className is merged with default button styles using cn() utility

### Requirement: Input Component
The system SHALL provide a labeled Input component with error state, icon support, and accessibility features that integrates with form libraries.

#### Scenario: Input with label and placeholder
- **WHEN** developer renders `<Input label="Email" placeholder="you@example.com" />`
- **THEN** input displays label above field, placeholder text in gray-400 color

#### Scenario: Input with error message
- **WHEN** developer renders `<Input error="Email is required" />`
- **THEN** input has red border, error message displays below in red text (text-red-600 text-sm)

#### Scenario: Input with left icon
- **WHEN** developer renders `<Input icon={<SearchIcon />} placeholder="Search..." />`
- **THEN** icon is positioned absolutely on left with 12px padding, input text has left padding to accommodate icon

#### Scenario: Focus state styling
- **WHEN** user focuses on input field
- **THEN** input shows 2px blue ring (focus:ring-2 focus:ring-blue-500) and border becomes transparent

#### Scenario: Disabled input state
- **WHEN** developer renders `<Input disabled />`
- **THEN** input has 50% opacity, cursor shows not-allowed, cannot be focused

#### Scenario: Ref forwarding for form libraries
- **WHEN** developer passes `ref` prop to Input component
- **THEN** ref is forwarded to underlying HTML input element for React Hook Form integration

### Requirement: Modal Component
The system SHALL provide a portal-rendered Modal component with backdrop, escape key handling, body scroll locking, and configurable sizes.

#### Scenario: Modal renders at document body
- **WHEN** developer renders `<Modal isOpen={true}>Content</Modal>`
- **THEN** modal is rendered using React.createPortal at document.body, not in parent container

#### Scenario: Backdrop click closes modal
- **WHEN** user clicks on dark backdrop (bg-black/50 area outside modal)
- **THEN** onClose callback is called and modal closes

#### Scenario: Escape key closes modal
- **WHEN** user presses Escape key while modal is open
- **THEN** onClose callback is called and modal closes

#### Scenario: Body scroll is locked when modal open
- **WHEN** modal isOpen becomes true
- **THEN** document.body.style.overflow is set to 'hidden', preventing page scroll

#### Scenario: Body scroll is restored when modal closes
- **WHEN** modal isOpen becomes false or component unmounts
- **THEN** document.body.style.overflow is reset to 'unset', restoring scroll

#### Scenario: Large modal for CSV preview table
- **WHEN** developer renders `<Modal size="lg">...</Modal>`
- **THEN** modal has max-width of 56rem (896px) for wide content

#### Scenario: Modal with footer buttons
- **WHEN** developer renders `<Modal footer={<Button>Save</Button>}>...</Modal>`
- **THEN** footer section displays at bottom with border-top, buttons right-aligned with 12px gap

#### Scenario: Close button in header
- **WHEN** modal is displayed
- **THEN** X icon button appears in top-right of header, clicking it calls onClose

### Requirement: Select Component
The system SHALL provide an accessible Select component using Headless UI Listbox with keyboard navigation, transition animations, and error state support.

#### Scenario: Select with options list
- **WHEN** developer renders `<Select options={[{value: 'a', label: 'Option A'}]} value="a" onChange={fn} />`
- **THEN** select button displays "Option A", clicking opens dropdown with single option

#### Scenario: Placeholder when no value selected
- **WHEN** developer renders `<Select value="" placeholder="Choose..." />`
- **THEN** select button displays "Choose..." in gray-400 color

#### Scenario: Keyboard navigation in dropdown
- **WHEN** user opens select dropdown and presses arrow down key
- **THEN** focus moves to next option with blue background highlight (bg-blue-50)

#### Scenario: Selected option has checkmark indicator
- **WHEN** dropdown is open and displays selected option
- **THEN** selected option is bolded (font-medium) to indicate selection

#### Scenario: Dropdown transition animation
- **WHEN** user clicks select button to open dropdown
- **THEN** dropdown fades in over 100ms using Headless UI Transition component

#### Scenario: Error state styling
- **WHEN** developer renders `<Select error="Field is required" />`
- **THEN** select button has red border, error message displays below in red text

#### Scenario: Select with label
- **WHEN** developer renders `<Select label="Country" />`
- **THEN** label displays above select button in text-sm font-medium text-gray-700

#### Scenario: Focus management with keyboard
- **WHEN** user tabs to select component and presses Enter
- **THEN** dropdown opens and first option receives focus for keyboard selection

### Requirement: Class Name Utility Function
The system SHALL provide a cn() utility function that merges conditional class names and resolves Tailwind CSS class conflicts.

#### Scenario: Conditional class names
- **WHEN** developer calls `cn('px-4', isActive && 'bg-blue-500')`
- **THEN** function returns merged string with conditional class applied when isActive is true

#### Scenario: Tailwind class conflict resolution
- **WHEN** developer calls `cn('px-4', 'px-6')`
- **THEN** function returns 'px-6' (later class wins), not 'px-4 px-6'

#### Scenario: Array and object syntax support
- **WHEN** developer calls `cn(['px-4', 'py-2'], { 'bg-black': isPrimary })`
- **THEN** function processes clsx-style syntax and merges classes correctly

#### Scenario: Undefined and null values ignored
- **WHEN** developer calls `cn('px-4', undefined, null, false, 'py-2')`
- **THEN** function returns 'px-4 py-2', ignoring falsy values

### Requirement: Component TypeScript Type Safety
The system SHALL enforce strict TypeScript typing for all UI components with proper HTMLAttributes extension and no 'any' types.

#### Scenario: Button extends ButtonHTMLAttributes
- **WHEN** developer passes onClick, disabled, or type props to Button
- **THEN** TypeScript accepts all standard HTML button attributes without errors

#### Scenario: Input extends InputHTMLAttributes
- **WHEN** developer passes placeholder, maxLength, or pattern props to Input
- **THEN** TypeScript accepts all standard HTML input attributes without errors

#### Scenario: No 'any' types in component props
- **WHEN** TypeScript compiler runs in strict mode
- **THEN** no component prop interfaces use 'any' type (except PapaParser callbacks where unavoidable)

#### Scenario: ReactNode for icon props
- **WHEN** developer passes icon prop to Button or Input
- **THEN** TypeScript accepts any valid React element (JSX, string, null)
