# UI Accessibility Specification

## MODIFIED Requirements

### Requirement: Modal Component
The system SHALL provide a portal-rendered Modal component with backdrop, escape key handling, body scroll locking, configurable sizes, **focus trap, ARIA attributes, and focus restoration**.

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
- **THEN** document.body.style.overflow is reset to previous value, restoring scroll

#### Scenario: Large modal for CSV preview table
- **WHEN** developer renders `<Modal size="lg">...</Modal>`
- **THEN** modal has max-width of 56rem (896px) for wide content

#### Scenario: Modal with footer buttons
- **WHEN** developer renders `<Modal footer={<Button>Save</Button>}>...</Modal>`
- **THEN** footer section displays at bottom with border-top, buttons right-aligned with 12px gap

#### Scenario: Close button in header
- **WHEN** modal is displayed
- **THEN** X icon button appears in top-right of header with `aria-label="Close"`, clicking it calls onClose

#### Scenario: Modal has ARIA dialog attributes
- **WHEN** modal is rendered
- **THEN** modal container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to title element

#### Scenario: Focus is trapped within modal
- **WHEN** user presses Tab while focus is on last focusable element in modal
- **THEN** focus moves to first focusable element in modal (not outside)

#### Scenario: Focus is trapped with Shift+Tab
- **WHEN** user presses Shift+Tab while focus is on first focusable element in modal
- **THEN** focus moves to last focusable element in modal (not outside)

#### Scenario: Modal auto-focuses first interactive element
- **WHEN** modal opens
- **THEN** focus automatically moves to first focusable element (close button or first input)

#### Scenario: Focus is restored when modal closes
- **WHEN** modal closes
- **THEN** focus returns to the element that was focused before modal opened

### Requirement: Input Component
The system SHALL provide a labeled Input component with error state, icon support, **ARIA error association**, and accessibility features that integrates with form libraries.

#### Scenario: Input with label and placeholder
- **WHEN** developer renders `<Input label="Email" placeholder="you@example.com" />`
- **THEN** input displays label above field, placeholder text in gray-400 color, label associated via htmlFor/id

#### Scenario: Input with error message announces to screen readers
- **WHEN** developer renders `<Input error="Email is required" />`
- **THEN** input has `aria-invalid="true"`, `aria-describedby` points to error element, error displays in red

#### Scenario: Input error element has matching ID
- **WHEN** Input has error prop
- **THEN** error message element has unique ID that matches input's `aria-describedby` value

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

#### Scenario: Input without error has no aria-invalid
- **WHEN** developer renders `<Input />` without error prop
- **THEN** input does not have `aria-invalid` attribute (undefined, not false)

### Requirement: Select Component
The system SHALL provide an accessible Select component using Headless UI Listbox with keyboard navigation, transition animations, **ARIA error association**, and error state support.

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

#### Scenario: Select error state with ARIA association
- **WHEN** developer renders `<Select error="Field is required" />`
- **THEN** select button has `aria-invalid="true"`, `aria-describedby` points to error element, red border, error message displays below

#### Scenario: Select error element has matching ID
- **WHEN** Select has error prop
- **THEN** error message element has unique ID that matches button's `aria-describedby` value

#### Scenario: Select with label
- **WHEN** developer renders `<Select label="Country" />`
- **THEN** label displays above select button in text-sm font-medium text-gray-700

#### Scenario: Focus management with keyboard
- **WHEN** user tabs to select component and presses Enter
- **THEN** dropdown opens and first option receives focus for keyboard selection

#### Scenario: Select without error has no aria-invalid
- **WHEN** developer renders `<Select />` without error prop
- **THEN** select button does not have `aria-invalid` attribute
