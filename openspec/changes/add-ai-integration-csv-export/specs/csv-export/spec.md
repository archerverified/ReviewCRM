# CSV Export Capability

## ADDED Requirements

### Requirement: Plusvibe CSV Format Export
The system SHALL export businesses to Plusvibe.ai compatible CSV format with 11 specific columns.

#### Scenario: Export with all columns in correct order
- **GIVEN** a list of businesses to export
- **WHEN** `exportToPlusvibe()` is called
- **THEN** the CSV contains columns in this order: FirstName, LastName, Email, CompanyName, City, Phone, MediaReviews, NegativeReviews, PricingTier, ProjectValue, PersonalizedMessage
- **AND** the header row is the first row

#### Scenario: Export with business data mapped correctly
- **GIVEN** a business with all fields populated
- **WHEN** `exportToPlusvibe()` is called
- **THEN** CompanyName maps from business_name
- **AND** Email maps from email
- **AND** City maps from city
- **AND** Phone maps from phone
- **AND** MediaReviews maps from media_reviews_count
- **AND** NegativeReviews maps from negative_reviews_count
- **AND** PricingTier maps from pricing_tier
- **AND** PersonalizedMessage maps from personalized_message

### Requirement: Name Parsing
The system SHALL parse contact names into FirstName and LastName components.

#### Scenario: Full name with first and last
- **GIVEN** a business with contact_name "John Smith"
- **WHEN** the name is parsed
- **THEN** FirstName is "John"
- **AND** LastName is "Smith"

#### Scenario: Full name with multiple last name parts
- **GIVEN** a business with contact_name "John Van Der Berg"
- **WHEN** the name is parsed
- **THEN** FirstName is "John"
- **AND** LastName is "Van Der Berg"

#### Scenario: Single name only
- **GIVEN** a business with contact_name "John"
- **WHEN** the name is parsed
- **THEN** FirstName is "John"
- **AND** LastName is empty string

#### Scenario: Missing contact name fallback
- **GIVEN** a business with null contact_name
- **WHEN** the name is parsed
- **THEN** FirstName is the business_name
- **AND** LastName is empty string

### Requirement: RFC 4180 CSV Escaping
The system SHALL properly escape CSV values according to RFC 4180 specification.

#### Scenario: Value containing comma
- **GIVEN** a field value contains a comma
- **WHEN** the value is escaped
- **THEN** the entire value is wrapped in double quotes

#### Scenario: Value containing double quote
- **GIVEN** a field value contains a double quote
- **WHEN** the value is escaped
- **THEN** the entire value is wrapped in double quotes
- **AND** internal quotes are doubled (e.g., He said "hello" becomes "He said ""hello""")

#### Scenario: Value containing newline
- **GIVEN** a field value contains a newline character
- **WHEN** the value is escaped
- **THEN** the entire value is wrapped in double quotes

#### Scenario: Value containing carriage return
- **GIVEN** a field value contains a carriage return character
- **WHEN** the value is escaped
- **THEN** the entire value is wrapped in double quotes

#### Scenario: Value without special characters
- **GIVEN** a field value contains no comma, quote, newline, or carriage return
- **WHEN** the value is escaped
- **THEN** the value is returned without quotes

### Requirement: Currency Formatting
The system SHALL format currency values with US locale.

#### Scenario: Format project value
- **GIVEN** a total_project_value of 11250
- **WHEN** the value is formatted
- **THEN** it displays as "$11,250.00"

#### Scenario: Format large project value
- **GIVEN** a total_project_value of 1500000
- **WHEN** the value is formatted
- **THEN** it displays as "$1,500,000.00"

#### Scenario: Format small project value
- **GIVEN** a total_project_value of 125
- **WHEN** the value is formatted
- **THEN** it displays as "$125.00"

### Requirement: Browser Download with UTF-8 BOM
The system SHALL trigger browser downloads with UTF-8 BOM for Excel compatibility.

#### Scenario: Download triggers correctly
- **GIVEN** a CSV content string
- **AND** a filename
- **WHEN** `downloadCSV()` is called
- **THEN** a Blob is created with UTF-8 BOM prefix (\uFEFF)
- **AND** content type is "text/csv;charset=utf-8;"
- **AND** a download link is created and clicked
- **AND** the link is removed after download

#### Scenario: UTF-8 BOM enables Excel to read Unicode
- **GIVEN** a CSV with Unicode characters (e.g., non-ASCII names)
- **WHEN** the file is opened in Excel
- **THEN** the characters display correctly

### Requirement: Standardized Export Filename
The system SHALL generate standardized filenames for exports.

#### Scenario: Generate filename with campaign name
- **GIVEN** a campaign name "Q1 Outreach 2024"
- **WHEN** `generateExportFilename()` is called
- **THEN** the filename follows format "plusvibe-export-q1-outreach-2024-{YYYY-MM-DD}-{HHmm}.csv"

#### Scenario: Sanitize campaign name
- **GIVEN** a campaign name with special characters "Test @#$ Campaign!"
- **WHEN** the filename is generated
- **THEN** special characters are replaced with hyphens
- **AND** consecutive hyphens are collapsed
- **AND** leading/trailing hyphens are removed

### Requirement: ExportButton Component
The system SHALL provide an ExportButton component that handles the complete export workflow.

#### Scenario: Export with no businesses selected
- **GIVEN** no businesses are selected
- **WHEN** the export button is clicked
- **THEN** an error toast displays "No businesses selected for export"
- **AND** no export is performed

#### Scenario: Export when all businesses have messages
- **GIVEN** all selected businesses have personalized_message populated
- **WHEN** the export button is clicked
- **THEN** CSV is generated immediately
- **AND** browser download is triggered
- **AND** success toast displays count and filename

#### Scenario: Export with businesses needing message generation
- **GIVEN** some selected businesses have null personalized_message
- **WHEN** the export button is clicked
- **THEN** info toast displays "Generating X personalized messages..."
- **AND** messages are generated in batches of 5 concurrently
- **AND** progress counter updates after each batch
- **AND** generated messages are saved to Supabase
- **AND** local state is updated
- **AND** CSV is generated with updated data
- **AND** browser download is triggered

#### Scenario: Batch processing respects concurrency limit
- **GIVEN** 15 businesses need message generation
- **WHEN** batch processing runs
- **THEN** first batch of 5 runs concurrently
- **AND** after completion, second batch of 5 runs
- **AND** after completion, third batch of 5 runs

#### Scenario: Resilient processing on partial failures
- **GIVEN** 10 businesses need message generation
- **AND** 3 API calls fail
- **WHEN** batch processing completes
- **THEN** warning toast displays "Generated 7 messages, 3 failed"
- **AND** export proceeds with successfully generated messages
- **AND** failed businesses are logged to console

#### Scenario: Button shows progress during export
- **GIVEN** export is in progress with 5 of 10 messages generated
- **WHEN** the button is rendered
- **THEN** button text shows "Generating messages... (5/10)"
- **AND** button is disabled
- **AND** loading indicator is visible

#### Scenario: Button shows count when idle
- **GIVEN** export is not in progress
- **AND** 25 businesses are selected
- **WHEN** the button is rendered
- **THEN** button text shows "Export to Plusvibe (25)"
