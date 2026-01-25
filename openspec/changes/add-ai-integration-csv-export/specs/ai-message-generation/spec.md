# AI Message Generation Capability

## ADDED Requirements

### Requirement: Firecrawl Agent API Integration
The system SHALL integrate with Firecrawl agent API (`https://api.firecrawl.dev/v1/agent`) for AI-powered message generation.

#### Scenario: Successful message generation
- **GIVEN** a valid request with businessName, city, and negativeReviews
- **AND** the FIRECRAWL_API_KEY environment variable is configured
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the system calls Firecrawl agent API with autonomous mode
- **AND** returns a cleaned personalized message

#### Scenario: Missing API key configuration
- **GIVEN** the FIRECRAWL_API_KEY environment variable is not set
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the system returns HTTP 500
- **AND** error message "AI service not configured. Please contact administrator."

### Requirement: Request Validation
The system SHALL validate all required fields before processing.

#### Scenario: Valid request with all required fields
- **GIVEN** a request body containing businessName (string), city (string), and negativeReviews (number)
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the request proceeds to message generation

#### Scenario: Missing required fields
- **GIVEN** a request body missing businessName, city, or negativeReviews
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the system returns HTTP 400
- **AND** error message "Missing required fields: businessName, city, negativeReviews"

### Requirement: Server-Side Rate Limiting
The system SHALL enforce rate limiting of 10 requests per minute per IP address.

#### Scenario: Request within rate limit
- **GIVEN** the client IP has made fewer than 10 requests in the current 60-second window
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the request proceeds normally
- **AND** the request count is incremented

#### Scenario: Rate limit exceeded
- **GIVEN** the client IP has made 10 or more requests in the current 60-second window
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the system returns HTTP 429
- **AND** error message "Rate limit exceeded. Maximum 10 requests per minute."

#### Scenario: Rate limit window reset
- **GIVEN** the client IP exceeded the rate limit
- **AND** 60 seconds have passed since the window started
- **WHEN** POST request is made to `/api/generate-message`
- **THEN** the request proceeds normally
- **AND** a new 60-second window is started

### Requirement: Response Cleaning
The system SHALL clean AI-generated responses before returning them.

#### Scenario: Remove surrounding quotes
- **GIVEN** the AI response contains surrounding single or double quotes
- **WHEN** the response is processed
- **THEN** the surrounding quotes are removed

#### Scenario: Normalize excessive line breaks
- **GIVEN** the AI response contains 3 or more consecutive line breaks
- **WHEN** the response is processed
- **THEN** they are normalized to 2 line breaks

#### Scenario: Remove subject lines
- **GIVEN** the AI response contains a "Subject:" line
- **WHEN** the response is processed
- **THEN** the subject line is removed

#### Scenario: Remove greetings
- **GIVEN** the AI response starts with "Hi", "Hello", or "Hey"
- **WHEN** the response is processed
- **THEN** the greeting is removed

### Requirement: Minimum Message Length Validation
The system SHALL validate that generated messages meet minimum length requirements.

#### Scenario: Message meets minimum length
- **GIVEN** the cleaned message is 50 or more characters
- **WHEN** the response is validated
- **THEN** the message is returned successfully

#### Scenario: Message too short
- **GIVEN** the cleaned message is fewer than 50 characters
- **WHEN** the response is validated
- **THEN** the system returns HTTP 500
- **AND** error message "Generated message too short. Please try again."

### Requirement: Comprehensive Error Handling
The system SHALL handle all API error cases with specific status codes.

#### Scenario: Firecrawl rate limit exceeded
- **GIVEN** the Firecrawl API returns HTTP 429
- **WHEN** the error is processed
- **THEN** the system returns HTTP 429
- **AND** error message "AI service rate limit exceeded. Please try again in a few moments."

#### Scenario: Invalid Firecrawl credentials
- **GIVEN** the Firecrawl API returns HTTP 401 or 403
- **WHEN** the error is processed
- **THEN** the system returns HTTP 500
- **AND** error message "Invalid AI API credentials. Please contact administrator."

#### Scenario: Unexpected Firecrawl response format
- **GIVEN** the Firecrawl API returns a response without result/output/response/message fields
- **WHEN** the response is processed
- **THEN** the system returns HTTP 500
- **AND** error message "Failed to generate message. Invalid response format."

### Requirement: Prompt Engineering
The system SHALL construct detailed prompts for message generation with business context.

#### Scenario: Standard prompt construction
- **GIVEN** a valid request with business details
- **WHEN** the prompt is constructed
- **THEN** it includes business name, city, and negative review count
- **AND** service offering (removal guarantee, timeline, local success)
- **AND** tone requirements (conversational, not salesy)
- **AND** output constraints (no subject, no signature, no greetings, 3-4 sentences)

#### Scenario: Custom instructions provided
- **GIVEN** a request includes optional instructions field
- **WHEN** the prompt is constructed
- **THEN** the custom instructions are appended to the prompt

#### Scenario: Template structure provided
- **GIVEN** a request includes optional template field
- **WHEN** the prompt is constructed
- **THEN** the template structure is included in the prompt
