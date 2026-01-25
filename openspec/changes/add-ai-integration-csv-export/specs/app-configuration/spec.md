# App Configuration Capability

## ADDED Requirements

### Requirement: Environment Variable Configuration
The system SHALL configure environment variables for Supabase and Firecrawl integration.

#### Scenario: Supabase credentials configured
- **GIVEN** the `.env.local` file exists
- **THEN** it contains NEXT_PUBLIC_SUPABASE_URL with the project URL
- **AND** NEXT_PUBLIC_SUPABASE_ANON_KEY with the anon key
- **AND** SUPABASE_SERVICE_ROLE_KEY with the service role key
- **AND** each variable has a descriptive comment

#### Scenario: Firecrawl API key configured
- **GIVEN** the `.env.local` file exists
- **THEN** it contains FIRECRAWL_API_KEY with the API key
- **AND** a comment indicating it's for AI message generation

#### Scenario: App URL configured for local development
- **GIVEN** the `.env.local` file exists
- **THEN** it contains NEXT_PUBLIC_APP_URL set to http://localhost:3000

### Requirement: Root Layout with Navigation
The system SHALL provide a root layout with fixed navigation header.

#### Scenario: Layout structure
- **GIVEN** the root layout component
- **THEN** it uses Next.js 14 App Router patterns
- **AND** includes html and body elements
- **AND** applies Inter font from next/font/google
- **AND** applies antialiased text rendering
- **AND** includes Toaster component from sonner

#### Scenario: Navigation header styling
- **GIVEN** the navigation header
- **THEN** it is fixed to the top of the viewport
- **AND** has white background
- **AND** has bottom border with black/10 opacity
- **AND** has z-index 40 for proper layering

#### Scenario: Navigation contains logo
- **GIVEN** the navigation header
- **THEN** it displays "ReviewCRM" logo on the left
- **AND** the logo links to home page (/)
- **AND** has hover state changing to blue-600

#### Scenario: Navigation contains page links
- **GIVEN** the navigation header
- **THEN** it contains links to: Businesses (/), Pipeline (/pipeline), Campaigns (/campaigns), Metrics (/metrics)
- **AND** each link has hover underline animation
- **AND** links are in font-medium weight

#### Scenario: Navigation contains user section
- **GIVEN** the navigation header
- **THEN** it displays "2ndimpression.co" company name
- **AND** displays user avatar with initials "AW"
- **AND** avatar has blue-600 background and white text

#### Scenario: Main content area
- **GIVEN** the layout
- **THEN** main content has pt-16 padding to account for fixed header
- **AND** is contained in max-w-7xl width
- **AND** has horizontal padding px-4
- **AND** has vertical padding py-8

### Requirement: Global CSS Updates
The system SHALL provide global styles compatible with Clay design system.

#### Scenario: Base layer styles
- **GIVEN** the globals.css file
- **THEN** it includes @tailwind base, components, utilities directives
- **AND** sets border-border for all elements in base layer
- **AND** sets bg-[#F8F6F3] (cream) as body background
- **AND** sets text-gray-900 as default text color

#### Scenario: Utility classes
- **GIVEN** the globals.css file
- **THEN** it includes text-balance utility class for text-wrap: balance

### Requirement: Metadata Configuration
The system SHALL configure appropriate metadata for the application.

#### Scenario: Page title and description
- **GIVEN** the layout metadata
- **THEN** title is "ReviewCRM | Reputation Management Pipeline"
- **AND** description mentions managing leads, campaigns, and sales pipeline for 2ndimpression.co

#### Scenario: Favicon configuration
- **GIVEN** the layout metadata
- **THEN** it references /favicon.ico as the icon

## MODIFIED Requirements

### Requirement: Dashboard Page with Bulk Actions
The dashboard page SHALL support bulk operations on selected businesses.

#### Scenario: Bulk actions toolbar visibility
- **GIVEN** the dashboard page
- **WHEN** one or more businesses are selected
- **THEN** the bulk actions toolbar is visible
- **AND** displays count of selected items

#### Scenario: Bulk stage update
- **GIVEN** businesses are selected
- **AND** the bulk actions toolbar is visible
- **WHEN** user selects a stage from the "Move to stage..." dropdown
- **THEN** all selected businesses are updated to that stage
- **AND** local state is updated
- **AND** selection is cleared
- **AND** success toast is displayed

#### Scenario: Bulk email status update
- **GIVEN** businesses are selected
- **AND** the bulk actions toolbar is visible
- **WHEN** user selects a status from the "Update email status..." dropdown
- **THEN** all selected businesses are updated to that status
- **AND** local state is updated
- **AND** selection is cleared
- **AND** success toast is displayed

#### Scenario: Export selected businesses
- **GIVEN** businesses are selected
- **AND** the bulk actions toolbar is visible
- **THEN** ExportButton component is rendered
- **AND** receives selected businesses as prop

#### Scenario: Clear selection button
- **GIVEN** businesses are selected
- **AND** the bulk actions toolbar is visible
- **WHEN** user clicks "Clear Selection" button
- **THEN** all selections are cleared
- **AND** bulk actions toolbar hides

### Requirement: Client-Side Filtering
The dashboard SHALL filter businesses based on filter state.

#### Scenario: Search filter
- **GIVEN** user enters text in search field
- **WHEN** filters are applied
- **THEN** businesses matching business_name, email, or city (case-insensitive) are shown

#### Scenario: Stage filter
- **GIVEN** user selects one or more pipeline stages
- **WHEN** filters are applied
- **THEN** only businesses in those stages are shown

#### Scenario: Email status filter
- **GIVEN** user selects one or more email statuses
- **WHEN** filters are applied
- **THEN** only businesses with those statuses are shown

#### Scenario: Pricing tier filter
- **GIVEN** user selects one or more pricing tiers
- **WHEN** filters are applied
- **THEN** only businesses with those tiers are shown

### Requirement: Business Table Styling
The dashboard table SHALL use consistent styling.

#### Scenario: Pricing tier badges
- **GIVEN** a business with bronze pricing tier
- **THEN** badge displays with bg-yellow-100 text-yellow-800

- **GIVEN** a business with silver pricing tier
- **THEN** badge displays with bg-gray-100 text-gray-800

- **GIVEN** a business with gold pricing tier
- **THEN** badge displays with bg-amber-100 text-amber-800

#### Scenario: Pipeline stage colors
- **GIVEN** a business with a pipeline stage
- **THEN** the stage label displays with the color from PIPELINE_STAGES config

#### Scenario: Table row hover state
- **GIVEN** a table row
- **WHEN** user hovers over the row
- **THEN** background changes to gray-50

### Requirement: Selection Logic
The dashboard SHALL support checkbox-based selection.

#### Scenario: Toggle individual selection
- **GIVEN** a business row
- **WHEN** user clicks the checkbox
- **THEN** the business is added to selectedIds Set
- **WHEN** user clicks again
- **THEN** the business is removed from selectedIds Set

#### Scenario: Select all filtered businesses
- **GIVEN** the header checkbox
- **WHEN** user clicks it while not all are selected
- **THEN** all filteredBusinesses are added to selectedIds

#### Scenario: Deselect all
- **GIVEN** the header checkbox
- **AND** all filtered businesses are selected
- **WHEN** user clicks it
- **THEN** selectedIds is cleared

#### Scenario: Header checkbox reflects state
- **GIVEN** the header checkbox
- **WHEN** all filteredBusinesses are selected AND at least one exists
- **THEN** checkbox is checked
- **OTHERWISE** checkbox is unchecked

### Requirement: Loading and Empty States
The dashboard SHALL display appropriate states.

#### Scenario: Loading state
- **GIVEN** businesses are being loaded
- **WHEN** loading is true
- **THEN** a centered spinner is displayed
- **AND** the table is not visible

#### Scenario: Empty state
- **GIVEN** businesses have loaded
- **AND** filteredBusinesses.length is 0
- **THEN** message "No businesses found. Import a CSV to get started." is displayed
