## ADDED Requirements

### Requirement: Business Entity Storage

The system SHALL store business lead information with fields for contact details, review data, pipeline status, and campaign association.

The system SHALL support the following business fields:
- `id` (UUID, auto-generated)
- `business_name` (required)
- `contact_name`, `email`, `phone` (optional contact info)
- `website_url`, `gmaps_url` (URLs)
- `city`, `state`, `industry` (location/classification)
- `google_rating`, `total_reviews` (review summary)
- `one_star_reviews` through `five_star_reviews` (star breakdown)
- `one_star_media_reviews`, `two_star_media_reviews` (media review counts)
- `pipeline_stage` (enum), `email_verification_status` (enum), `email_outreach_status` (enum)
- `personalized_message`, `notes` (text fields)
- `campaign_id` (foreign key to campaigns)
- `created_at`, `updated_at`, `last_contacted_at` (timestamps)

#### Scenario: Create business with minimal data
- **WHEN** a business is created with only `business_name`
- **THEN** the business is saved with auto-generated `id` and default values

#### Scenario: Create business with full review data
- **WHEN** a business is created with star breakdown (1-5 star counts) and media review counts
- **THEN** all GENERATED columns (pricing, projected rating) are auto-calculated

---

### Requirement: Auto-Calculated Total Media Reviews

The system SHALL automatically calculate `total_media_reviews` as the sum of `one_star_media_reviews` and `two_star_media_reviews`.

The calculation SHALL be implemented as a PostgreSQL GENERATED ALWAYS column.

#### Scenario: Media reviews sum calculation
- **WHEN** a business has `one_star_media_reviews = 10` and `two_star_media_reviews = 5`
- **THEN** `total_media_reviews` SHALL equal `15`

#### Scenario: Null handling in media reviews
- **WHEN** either media review count is NULL
- **THEN** it SHALL be treated as 0 in the calculation

---

### Requirement: Auto-Calculated Pricing Tier

The system SHALL automatically calculate `pricing_tier` based on `total_media_reviews`:
- 1-24 media reviews: `standard`
- 25-49 media reviews: `volume`
- 50+ media reviews: `enterprise`
- 0 media reviews: NULL

#### Scenario: Standard tier assignment
- **WHEN** a business has `total_media_reviews` between 1 and 24
- **THEN** `pricing_tier` SHALL be `standard`

#### Scenario: Volume tier assignment
- **WHEN** a business has `total_media_reviews` between 25 and 49
- **THEN** `pricing_tier` SHALL be `volume`

#### Scenario: Enterprise tier assignment
- **WHEN** a business has `total_media_reviews` of 50 or more
- **THEN** `pricing_tier` SHALL be `enterprise`

---

### Requirement: Auto-Calculated Price Per Review

The system SHALL automatically calculate `price_per_review` based on `total_media_reviews`:
- 1-24 media reviews: $125
- 25-49 media reviews: $110
- 50+ media reviews: $90
- 0 media reviews: $125 (default)

#### Scenario: Standard pricing
- **WHEN** a business has 15 media reviews
- **THEN** `price_per_review` SHALL be `125`

#### Scenario: Volume pricing
- **WHEN** a business has 30 media reviews
- **THEN** `price_per_review` SHALL be `110`

#### Scenario: Enterprise pricing
- **WHEN** a business has 75 media reviews
- **THEN** `price_per_review` SHALL be `90`

---

### Requirement: Auto-Calculated Total Project Value

The system SHALL automatically calculate `total_project_value` as `total_media_reviews * price_per_review`.

#### Scenario: Project value calculation
- **WHEN** a business has 15 media reviews at standard pricing
- **THEN** `total_project_value` SHALL be `15 * 125 = 1875`

#### Scenario: Volume project value
- **WHEN** a business has 30 media reviews at volume pricing
- **THEN** `total_project_value` SHALL be `30 * 110 = 3300`

---

### Requirement: Projected Rating Calculation

The system SHALL automatically calculate `projected_rating` representing the business's Google rating after removal of media reviews.

The formula SHALL be:
- new_one_star = one_star_reviews - one_star_media_reviews
- new_two_star = two_star_reviews - two_star_media_reviews
- remaining_reviews = total_reviews - total_media_reviews
- projected_rating = (1*new_one + 2*new_two + 3*three + 4*four + 5*five) / remaining_reviews

#### Scenario: Rating improvement calculation
- **WHEN** a business has 100 total reviews with breakdown:
  - 12 one-star (10 with media)
  - 8 two-star (5 with media)
  - 15 three-star
  - 25 four-star
  - 40 five-star
- **THEN** `projected_rating` SHALL be approximately 4.2 (higher than original due to removed negative reviews)

#### Scenario: Zero remaining reviews
- **WHEN** `total_reviews` minus `total_media_reviews` equals 0
- **THEN** `projected_rating` SHALL be NULL

---

### Requirement: 19-Stage Pipeline Tracking

The system SHALL track business leads through a 19-stage pipeline using the `pipeline_stage_enum` type.

The pipeline stages SHALL be (in order):
1. `lead_scraped` - Initial lead entry
2. `email_verified` - Email validated
3. `campaign_ready` - Ready for outreach
4. `outreach_sent` - Initial email sent
5. `positive_reply` - Received positive response
6. `awaiting_audit` - Waiting for review audit
7. `audit_complete` - Audit finished
8. `proposal_sent` - Proposal delivered
9. `follow_up_1` - First follow-up
10. `follow_up_2` - Second follow-up
11. `qualified_lead` - Qualified for sales
12. `in_negotiation` - Active negotiation
13. `deal_closed` - Contract signed
14. `in_service_delivery` - Work in progress
15. `service_complete` - Work finished
16. `payment_collected` - Payment received
17. `follow_up_list` - Post-service follow-up
18. `lost_opportunity` - Did not convert
19. `do_not_contact` - Permanently excluded

#### Scenario: Default pipeline stage
- **WHEN** a new business is created without specifying pipeline_stage
- **THEN** `pipeline_stage` SHALL default to `lead_scraped`

#### Scenario: Stage progression
- **WHEN** a business's `pipeline_stage` is updated from one stage to another
- **THEN** a record SHALL be created in `stage_history` with old and new stages

---

### Requirement: Email Verification Status Tracking

The system SHALL track email verification status using the `email_verification_status_enum` type.

Valid statuses SHALL be:
- `unverified` - Not yet checked (default)
- `good` - Email verified and deliverable
- `risky` - Email may bounce or be spam-trapped
- `bad` - Email invalid or undeliverable

#### Scenario: Default verification status
- **WHEN** a new business is created
- **THEN** `email_verification_status` SHALL default to `unverified`

---

### Requirement: Email Outreach Status Tracking

The system SHALL track email outreach status using the `email_outreach_status_enum` type.

Valid statuses SHALL be:
- `not_sent` - No email sent yet (default)
- `sent` - Email sent
- `opened` - Email opened by recipient
- `clicked` - Link clicked in email
- `replied` - Recipient replied
- `bounced` - Email bounced
- `unsubscribed` - Recipient unsubscribed

#### Scenario: Default outreach status
- **WHEN** a new business is created
- **THEN** `email_outreach_status` SHALL default to `not_sent`

---

### Requirement: Campaign Management

The system SHALL store campaigns with fields for AI personalization, metrics tracking, and Plusvibe integration.

Campaign fields SHALL include:
- `id`, `name` (required), `description`
- `template`, `custom_instructions`, `ai_instructions`, `message_template` (AI config)
- `businesses_count`, `total_count`, `generated_count` (counts)
- `emails_sent`, `emails_opened`, `replies_received`, `deals_closed`, `total_revenue` (metrics)
- `status` (draft, generating, ready, exported, active, paused, completed)
- `plusvibe_campaign_id`, `plusvibe_exported_at` (integration)
- `created_at`, `updated_at`

#### Scenario: Create campaign
- **WHEN** a campaign is created with a name
- **THEN** it SHALL have `status = 'draft'` and zero metrics by default

#### Scenario: Track campaign metrics
- **WHEN** campaign metrics are updated
- **THEN** `updated_at` SHALL be automatically set to current timestamp

---

### Requirement: Tag System

The system SHALL support a many-to-many tagging system for businesses.

The system SHALL maintain:
- `tags` table with `id`, `name` (unique), `color`, `created_at`
- `business_tags` junction table with composite primary key (`business_id`, `tag_id`)

#### Scenario: Tag a business
- **WHEN** a tag is associated with a business
- **THEN** a record SHALL be created in `business_tags` with both IDs

#### Scenario: Remove tag cascades
- **WHEN** a tag is deleted
- **THEN** all `business_tags` records referencing that tag SHALL be deleted

#### Scenario: Delete business cascades
- **WHEN** a business is deleted
- **THEN** all `business_tags` records for that business SHALL be deleted

---

### Requirement: Stage Change Audit Trail

The system SHALL maintain an audit trail of pipeline stage changes in the `stage_history` table.

Each history record SHALL include:
- `id` (UUID)
- `business_id` (foreign key)
- `old_stage` (previous stage)
- `new_stage` (new stage)
- `changed_by` (database user)
- `notes` (optional comment)
- `changed_at` (timestamp)

#### Scenario: Automatic history tracking
- **WHEN** a business's `pipeline_stage` is updated
- **THEN** a trigger SHALL automatically create a `stage_history` record

#### Scenario: History preserves old and new values
- **WHEN** a stage changes from `lead_scraped` to `email_verified`
- **THEN** the history record SHALL have `old_stage = 'lead_scraped'` and `new_stage = 'email_verified'`

---

### Requirement: Data Validation Constraints

The system SHALL enforce data validation at the database level.

Constraints SHALL include:
- Email: Valid email format or NULL
- Phone: E.164 format (`^\+?[1-9]\d{1,14}$`) or NULL
- Google Rating: Between 1.0 and 5.0 or NULL

#### Scenario: Invalid email rejected
- **WHEN** an invalid email format is inserted
- **THEN** the database SHALL reject the insert with a constraint violation

#### Scenario: Valid email accepted
- **WHEN** a valid email like `user@example.com` is inserted
- **THEN** the insert SHALL succeed

#### Scenario: NULL values allowed
- **WHEN** email, phone, or google_rating is NULL
- **THEN** the constraint SHALL pass

---

### Requirement: Row Level Security

The system SHALL enable Row Level Security (RLS) on all tables.

RLS policies SHALL:
- Be enabled on: businesses, campaigns, tags, business_tags, stage_history
- Allow all operations for authenticated users (`auth.role() = 'authenticated'`)

#### Scenario: Authenticated user access
- **WHEN** an authenticated user queries any table
- **THEN** they SHALL have full CRUD access

#### Scenario: Unauthenticated access denied
- **WHEN** an unauthenticated request is made
- **THEN** the query SHALL return no rows (RLS enforced)
