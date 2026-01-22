# CSV Import Workflow Specification

## ADDED Requirements

### Requirement: D7 Lead Finder CSV Auto-Detection
The system SHALL automatically detect and map D7 Lead Finder CSV column headers to ReviewCRM database fields with intelligent column name matching.

#### Scenario: Exact column name match
- **WHEN** CSV file contains column "BusinessName"
- **THEN** system auto-maps to business_name field without user intervention

#### Scenario: Column name variation detection
- **WHEN** CSV file contains "Business Name" (with space) instead of "BusinessName"
- **THEN** system recognizes variation and auto-maps to business_name field

#### Scenario: Multiple variations checked in order
- **WHEN** CSV file has non-standard column names
- **THEN** system checks each field's variation list (e.g., "Company", "Company Name", "Business") until match found

#### Scenario: Required field missing shows unmapped
- **WHEN** CSV file lacks column for business_name field
- **THEN** system sets mapping to empty string, allows user to manually select correct column

#### Scenario: Media reviews column detection
- **WHEN** CSV contains "1 Star Reviews w/ Media" column
- **THEN** system maps to one_star_media_reviews field (critical for pricing calculation)

### Requirement: CSV Field Mapping Interface
The system SHALL provide a visual column mapping interface with dropdowns for each database field, showing preview data and auto-detected mappings.

#### Scenario: Column mapping grid layout
- **WHEN** user reaches mapping step after file upload
- **THEN** system displays 2-column grid with all 16 database fields as Select dropdowns

#### Scenario: Preview table shows first 3 rows
- **WHEN** CSV file is parsed successfully
- **THEN** system displays table with first 3 rows and first 6 columns for data validation

#### Scenario: Preview table shows actual values
- **WHEN** user views preview table
- **THEN** each cell displays exact CSV values (not truncated) for manual verification

#### Scenario: Dropdown shows available CSV columns
- **WHEN** user clicks Select dropdown for any database field
- **THEN** dropdown lists all CSV column headers from uploaded file

#### Scenario: Auto-detected mappings pre-selected
- **WHEN** mapping interface loads with auto-detection complete
- **THEN** all Select dropdowns show detected column names pre-selected

#### Scenario: User can override auto-detection
- **WHEN** user changes Select dropdown value
- **THEN** system updates mapping and highlights field as manually overridden

### Requirement: CSV File Upload and Parsing
The system SHALL accept CSV file uploads, parse with PapaParse, validate structure, and handle parsing errors gracefully.

#### Scenario: File input accepts only CSV
- **WHEN** user clicks file upload input
- **THEN** browser file picker shows only .csv files (accept=".csv" attribute)

#### Scenario: PapaParse with header detection
- **WHEN** CSV file is selected and parsing begins
- **THEN** PapaParse runs with header: true, skipEmptyLines: true options

#### Scenario: Parse preview for performance
- **WHEN** file contains 10,000+ rows
- **THEN** system parses only first 100 rows (preview: 100) for mapping interface

#### Scenario: CSV parse error shows toast
- **WHEN** PapaParse encounters malformed CSV (unclosed quotes, wrong encoding)
- **THEN** system displays error toast with message "CSV parse error: [error message]"

#### Scenario: Empty file validation
- **WHEN** user uploads CSV with zero data rows (only headers)
- **THEN** system shows error "CSV file is empty or has no data rows"

### Requirement: Batch Import with Progress Tracking
The system SHALL import CSV rows in batches of 100 with real-time progress indicator and error handling per batch.

#### Scenario: Import processes in 100-row batches
- **WHEN** user clicks "Import X Rows" button with 500-row file
- **THEN** system processes 5 batches sequentially (batch 1: rows 0-99, batch 2: rows 100-199, etc.)

#### Scenario: Progress bar updates per batch
- **WHEN** batch import is running
- **THEN** progress bar updates to show percentage complete (e.g., batch 2/5 complete = 40%)

#### Scenario: Rows without business name skipped
- **WHEN** batch contains rows where business_name field is empty or whitespace-only
- **THEN** system filters out those rows, only imports rows with valid business names

#### Scenario: Batch insert to Supabase
- **WHEN** batch of 100 valid rows is ready
- **THEN** system calls supabase.from('businesses').insert(businessRecords) once per batch

#### Scenario: Batch error captured but import continues
- **WHEN** batch 2 fails with Supabase error (e.g., duplicate key violation)
- **THEN** system logs error "Batch 2: [error message]", continues with batch 3

#### Scenario: Import completes with success count
- **WHEN** all batches finish processing
- **THEN** system shows success toast "Imported X businesses successfully"

### Requirement: Database Field Transformation and Defaults
The system SHALL transform CSV string values to appropriate data types and set default values for pipeline_stage and email statuses.

#### Scenario: Numeric field parsing with fallback
- **WHEN** CSV contains google_rating value "4.5"
- **THEN** system parses to float 4.5, not string

#### Scenario: Numeric field empty string becomes zero
- **WHEN** CSV total_reviews column is empty string or missing
- **THEN** system sets total_reviews to 0 (not null)

#### Scenario: Star review counts parsed as integers
- **WHEN** CSV contains "1 Star Reviews" value "15"
- **THEN** system parses to integer 15 for one_star_reviews field

#### Scenario: Default pipeline_stage for new imports
- **WHEN** business record is created from CSV import
- **THEN** system sets pipeline_stage to 'lead_scraped' (first stage in pipeline)

#### Scenario: Default email_verification_status
- **WHEN** business record is created from CSV import
- **THEN** system sets email_verification_status to 'unverified' (requires Brainzey validation)

#### Scenario: Default email_outreach_status
- **WHEN** business record is created from CSV import
- **THEN** system sets email_outreach_status to 'not_sent' (no campaigns run yet)

#### Scenario: Computed fields auto-calculated by database
- **WHEN** business record is inserted with media review counts
- **THEN** PostgreSQL automatically calculates total_media_reviews, pricing_tier, price_per_review, total_project_value (via GENERATED columns)

### Requirement: Import Modal Workflow States
The system SHALL guide user through 4-step import workflow: upload → mapping → importing → complete with clear visual states.

#### Scenario: Initial state shows upload screen
- **WHEN** user opens ImportModal
- **THEN** modal displays upload icon, "Upload D7 Lead Finder CSV" title, and file input button

#### Scenario: Transition to mapping after file select
- **WHEN** CSV file is successfully parsed
- **THEN** modal transitions from 'upload' step to 'mapping' step showing column mappings

#### Scenario: Importing state shows progress bar
- **WHEN** user clicks "Import X Rows" button
- **THEN** modal transitions to 'importing' step with animated progress bar and percentage text

#### Scenario: Complete state shows success summary
- **WHEN** import finishes (all batches processed)
- **THEN** modal transitions to 'complete' step with green checkmark, "Imported X businesses" message

#### Scenario: Complete state shows error list if failures
- **WHEN** import completes but some batches had errors
- **THEN** modal displays red error box with list of batch errors below success message

#### Scenario: Done button closes modal and refreshes data
- **WHEN** user clicks "Done" button on complete screen
- **THEN** modal closes, calls onImportComplete(count) callback to refresh BusinessGrid

#### Scenario: Cancel button resets modal state
- **WHEN** user clicks "Cancel" on mapping screen
- **THEN** modal closes, resets to 'upload' step, clears file/csvData/headers state

### Requirement: Toast Notification Integration
The system SHALL display toast notifications for import success, errors, and validation failures using sonner library.

#### Scenario: Success toast on import complete
- **WHEN** import completes with 250 businesses imported
- **THEN** system displays green success toast "Imported 250 businesses successfully"

#### Scenario: Error toast on CSV parse failure
- **WHEN** CSV file cannot be parsed (malformed structure)
- **THEN** system displays red error toast "CSV parse error: [PapaParse error message]"

#### Scenario: Error toast on import failure
- **WHEN** import process catches exception during batch processing
- **THEN** system displays red error toast "Import failed: [error message]"

#### Scenario: Toast auto-dismisses after 5 seconds
- **WHEN** success or error toast is displayed
- **THEN** toast automatically fades out and disappears after 5-second duration

### Requirement: Refactored ImportModal Component Structure
The system SHALL use new ui/Modal, ui/Button, and ui/Select primitives instead of raw HTML, reducing code duplication and improving maintainability.

#### Scenario: Modal component replaces fixed positioning div
- **WHEN** ImportModal renders with isOpen={true}
- **THEN** component uses `<Modal isOpen={isOpen} onClose={resetModal} title="..." size="lg">` instead of div.fixed.inset-0

#### Scenario: Button components replace className strings
- **WHEN** ImportModal renders action buttons
- **THEN** component uses `<Button variant="primary">` and `<Button variant="secondary">` instead of button.clay-btn-primary

#### Scenario: Select components replace HTML select elements
- **WHEN** column mapping interface renders
- **THEN** component uses `<Select options={columnOptions} value={mapping.field} onChange={...}>` for each field

#### Scenario: Modal footer prop used for buttons
- **WHEN** mapping step is active
- **THEN** component passes Cancel and Import buttons as `footer` prop to Modal component

#### Scenario: Code reduction from refactor
- **WHEN** refactor is complete
- **THEN** ImportModal.tsx has approximately 560 lines (down from 667 lines) due to primitive reuse

## MODIFIED Requirements

None - This is a new capability. The existing ImportModal.tsx implementation is being refactored to use new primitives, but core functionality remains identical.

## REMOVED Requirements

None - No features are being removed.
