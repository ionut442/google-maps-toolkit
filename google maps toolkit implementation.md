# Codex Implementation Plan — Local Service Business Action Page

## Master Product Context

This project is a lightweight SaaS platform for local service businesses.

Each business receives one simple, mobile-first public page containing a collection of practical customer actions. The business does **not** design a traditional website. It configures useful tools and information.

A customer who finds the business through Google Maps, Instagram, Facebook, a QR code, a referral, or another directory should be able to open one link and immediately do useful things such as:

- Call the business
- Open WhatsApp
- Request a quote
- Check typical pricing
- Check whether the business serves their area
- Verify licences, insurance, warranties, and certifications
- Read common questions
- Leave a Google review
- Save the business as a contact
- Use other small utilities enabled by the business

The internal product principle is:

> **The action page for local service businesses.**

The customer should not simply read about the business. They should be able to **do the next thing**.

The product is intentionally positioned between a normal website and a large business-management platform.

It must **not** become:

- A website builder
- A CRM
- An invoicing application
- A payment processor
- A booking platform
- A calendar-management system
- A staff-management application
- A communications platform
- A marketing automation suite
- A document-signing platform

Whenever a new feature is proposed, apply this test:

> **Can this remain a tiny standalone utility?**

If implementing the feature requires a business workflow, customer state machine, extensive administration, complex integrations, ongoing messaging infrastructure, financial records, or large amounts of operational state, it probably does not belong in this product.

---

## Core Product Rules

The implementation must preserve the following principles throughout every goal.

### Configure, Don't Design

Businesses configure tools, information, and settings.

They do not build page layouts.

There must be no free-form visual designer, arbitrary page builder, drag-and-drop canvas, or user-defined layout system.

### Actions, Not Pages

The public page exists to help customers act.

There should be almost no conventional website navigation.

Do not build a traditional structure such as:

- Home
- About
- Services
- Gallery
- Contact

Instead, the platform presents the most useful actions in a controlled order.

### One Primary Goal

Every business selects one **Primary Action**.

For most service businesses this will be:

> **Get a Quote**

The primary CTA must be visually dominant.

Call, WhatsApp, pricing, service area, trust, FAQ, reviews, and other utilities support that conversion.

### Use Existing Customer Tools

Whenever possible, hand the customer off to tools already available on their device.

Examples:

- Call → phone app
- WhatsApp → WhatsApp
- Review → Google
- Save business → contact/vCard
- Future reminder → calendar

Do not build internal infrastructure when a device-native or existing service can provide the experience.

### Avoid Workflow Software

Features that require pipelines, status systems, staff management, extensive messaging, booking workflows, financial records, or large state machines should be treated as out of scope.

---

## Initial Target Customer

The first version should focus on local service businesses with highly similar customer journeys, especially owner-operated companies and small teams.

Examples include:

- Plumbing
- HVAC
- Electrical
- Roofing
- Cleaning
- Landscaping
- Pressure washing
- Pest control
- Handyman services
- Painting
- Mobile detailing
- Appliance repair
- Pool services
- Garage-door services

These businesses generally need to answer the same questions:

> Can you do the job?

> Do you serve my location?

> Roughly how much will it cost?

> Can I trust you?

> How do I contact you?

This overlap is what allows the product to remain simple.

Restaurants, salons, dentists, lawyers, gyms, and other categories may be supported later, but they should not influence the initial architecture.

---

## Global Engineering Rules for Every `/goal`

Before changing code in any goal:

1. Inspect the existing repository.
2. Understand the current framework, package manager, project structure, database, authentication, environment handling, test setup, styling system, deployment assumptions, and existing conventions.
3. Reuse working infrastructure where practical.
4. Do not replace previous architecture simply because another approach is theoretically cleaner.
5. Treat completed functionality from earlier goals as established project architecture unless there is a compelling technical reason to modify it.
6. Prefer straightforward, maintainable implementation over premature abstraction.
7. Keep the repository runnable at the end of every goal.
8. Run relevant formatting, linting, type checking, tests, and build verification before declaring a goal complete.
9. Update migrations, seed data, and documentation whenever implementation changes require them.
10. Do not introduce functionality from later goals unless it is genuinely required as infrastructure for the current goal.

If the repository is greenfield and no technology decisions have already been made, use a pragmatic TypeScript-based full-stack architecture suitable for a small SaaS. A reasonable default is:

- Next.js
- TypeScript
- PostgreSQL
- A typed ORM
- Schema validation
- Object storage for uploads
- Transactional email
- A straightforward deployment model

This stack is a recommendation, not a product requirement. Existing repository decisions take priority.

---

# `/goal 1` — SaaS Foundation, Data Model, Authentication, Onboarding, Templates, and Dashboard

## Objective

Build the complete SaaS foundation and business setup experience.

At the end of this goal, a local service business owner must be able to create an account, select their type of business, receive a preconfigured toolkit, enter their business information, configure basic module settings, select a primary CTA, publish the business, and reach a functional dashboard.

This goal establishes the architecture that later goals will extend.

Do not build the full customer-facing tool implementations yet unless a minimal implementation is required to validate the architecture.

---

## Repository and Architecture Assessment

Begin by inspecting the repository and documenting the relevant architectural decisions.

Determine:

- Application framework
- Routing strategy
- Rendering strategy
- Database system
- ORM or query layer
- Authentication implementation
- Authorization model
- Environment-variable management
- UI/component system
- Form handling
- Validation approach
- File storage, if already present
- Email infrastructure, if already present
- Test strategy
- Logging/error handling
- Deployment assumptions

If important infrastructure is missing, establish it in a way that supports the rest of V1 without introducing unnecessary complexity.

Create a short architecture document or equivalent project documentation covering the major decisions made in this phase.

---

## Core Domain Model

Design the data model around the following concepts.

### User / Account

Support email/password authentication.

The account model should allow a user to own or manage a business.

Even if the first UI assumes one primary business per user, avoid hard-coding the database so tightly that supporting multiple businesses later becomes unnecessarily difficult.

Required concerns include:

- Unique account identity
- Email normalization where appropriate
- Password security
- Created/updated timestamps
- Account ownership relationships
- Authorization checks on every business-owned resource

### Business

A business should support at least:

- Name
- Unique public slug
- Business type / industry
- Logo
- Short description
- Phone number
- WhatsApp number
- Email
- Optional website
- Brand colour
- Google review URL
- Primary action
- Published/unpublished state
- Created/updated timestamps

Business information should be treated as shared profile data.

Values entered once should be reused by tools that need them.

Examples:

- Phone number → Call action
- Phone number → vCard
- Phone number → quote lead email
- WhatsApp number → WhatsApp action
- Business name → public page
- Business name → QR/review assets
- Email → lead delivery
- Brand colour → public page theme
- Review URL → Review action and Review QR

Avoid forcing the owner to enter the same information repeatedly in different modules.

### Industry Template

Create a real template system rather than hard-coding onboarding behavior into the UI.

Initial industries should include the service-business categories from the product specification.

Prioritize particularly strong defaults for:

- Plumbing
- HVAC
- Pressure Washing
- Cleaning

A template should be capable of defining:

- Default enabled modules
- Default disabled modules
- Module order
- Default primary CTA
- Suggested quote-form fields
- Suggested FAQs
- Suggested pricing mode if useful
- Industry-specific labels or starter content where appropriate

Templates are a core product feature, not merely an onboarding shortcut.

The owner should start with something useful rather than an empty dashboard.

### Business Module Configuration

Create an extensible but controlled module architecture.

Every configured business module should have at least:

- Business relationship
- Module type
- Enabled state
- Display order
- Validated configuration
- Created/updated timestamps

Use a typed or otherwise strongly validated configuration model.

Do not create a generic CMS.

The system should know which module types exist and what configuration each module accepts.

Initial module types:

- Call / WhatsApp
- Quote Request
- Pricing
- Service Area
- Trust / Credentials
- FAQ
- Review
- Save Contact

Pricing must remain one underlying module with supported modes.

Trust, licensing, insurance, certifications, and warranties must remain one Trust module.

Review functionality belongs to one Review Kit concept.

---

## Authentication and Authorization

Implement the authentication experience required for V1.

At minimum:

- Account creation
- Login
- Logout
- Protected dashboard routes
- Secure session handling
- Password storage using appropriate password hashing
- Proper validation
- Clear authentication errors
- Ownership/authorization enforcement

Do not rely only on UI hiding.

Every server-side operation that reads or changes business-owned data must verify that the current user is allowed to access that business.

If password-reset functionality is easy to support within the chosen auth stack, include it. Do not allow it to derail the goal if it requires an unrelated authentication project.

---

## Onboarding Flow

Implement onboarding as a coherent guided experience.

### Step 1 — Create Account

Collect:

- Business owner email
- Password
- Business name where useful

Avoid asking for unnecessary information.

### Step 2 — Choose Business Type

Ask:

> What type of business do you run?

The selected business type should automatically generate a recommended toolkit.

Example Plumbing starting configuration:

- Get a Quote
- Call / Emergency Call
- WhatsApp
- Pricing
- Service Area
- Trust / Credentials
- FAQ
- Review
- Save Contact

The user should not be presented with a blank configuration screen.

### Step 3 — Business Details

Collect:

- Business name
- Logo
- Short description
- Phone number
- WhatsApp number
- Email
- Brand colour
- Google review URL
- Optional website

Use clear validation.

Normalize phone-related data where appropriate without destroying the user-facing formatting needed for display.

### Step 4 — Initial Tool Configuration

Show the recommended tools generated from the template.

Allow the owner to:

- See which tools are active
- Disable tools
- Enable supported tools
- Enter basic configuration
- Reorder modules
- Review defaults

Do not expose raw technical configuration.

Do not build a page-layout editor.

### Step 5 — Primary CTA

Allow the owner to select one supported Primary Action.

For most templates, default to:

> Get a Quote

Other actions can be available where sensible, but only one should be the primary action at a time.

### Step 6 — Publish

Publishing should generate a public URL using the business slug.

Conceptually:

`platform.com/abc-plumbing`

The owner should receive:

- View Page
- Copy Link
- Page QR placeholder/action point for later implementation

If QR generation belongs technically in a later goal, it is acceptable for the dashboard to reserve the UI location until Goal 5.

---

## Slug and Routing Design

Implement public slugs carefully.

Requirements:

- Generate a sensible slug from the business name
- Enforce uniqueness
- Support collision handling
- Block reserved application routes
- Avoid collisions with framework/system paths
- Validate slug changes if editing is allowed
- Ensure unpublished pages are not publicly accessible

Reserved examples may include:

- app
- dashboard
- login
- signup
- api
- admin
- assets
- static
- settings

Use the actual application routes when determining the final reserved list.

---

## Dashboard

Build the first complete dashboard shell.

The dashboard should remain deliberately small.

### Your Page

Show:

- Public URL
- Published/unpublished state
- View Page
- Copy Link
- Page QR area or placeholder

### Primary Action

Show the currently selected Primary Action.

Allow the owner to change it to another supported action.

### Your Tools

Show configured modules.

Each module should support:

- Active/inactive state
- Edit/configure action
- Reordering

Use a straightforward interaction for ordering.

Do not over-engineer drag-and-drop if simple move controls are more robust.

There must be no free-form page designer.

### Recent Activity

Create the dashboard section even if activity data will be populated in later goals.

The intended metrics are:

- Page visitors
- Quote submissions
- Call clicks
- WhatsApp clicks
- Review clicks

Use appropriate empty states until later goals implement tracking.

---

## UX Requirements

The owner-facing experience should feel like configuration software, not website-design software.

Prioritize:

- Clear steps
- Strong defaults
- Minimal fields
- Helpful starter content
- Immediate preview/value
- Mobile-capable dashboard, while desktop can remain the primary configuration environment
- Good loading states
- Validation messages near the relevant field
- Useful empty states
- Clear success feedback

Avoid:

- Technical terminology such as "module JSON"
- Complex settings panels
- Excessive tabs
- Empty-builder experiences
- Generic CMS terminology
- Arbitrary layout controls

---

## Goal 1 Explicit Exclusions

Do not build the complete implementations of:

- Quote submissions
- Photo uploads
- Email lead delivery
- Price calculations
- Postal-code service-area checking
- Credential uploads
- Review QR
- Page QR
- Review Kit assets
- Analytics collection
- Advanced public-page polish

Do not build:

- Booking
- Payments
- CRM workflows
- Customer status pipelines
- Invoicing
- Internal messaging
- Automated WhatsApp/SMS
- Custom domains
- Advanced analytics
- Website/page builder
- Arbitrary form builder

---

## Goal 1 Definition of Done

This goal is complete when:

1. The project has a coherent production-oriented architecture.
2. Database migrations are reproducible.
3. Authentication works.
4. Authorization is enforced.
5. A user can create a business.
6. A user can choose an industry.
7. The industry selection generates a useful default toolkit.
8. Business profile information can be entered and edited.
9. Modules can be enabled/disabled.
10. Modules can be reordered.
11. One module/action can be selected as the Primary Action.
12. The business can be published/unpublished.
13. A safe unique public slug is generated.
14. The dashboard presents page status, primary action, tools, and activity areas.
15. Seed/development data includes at least several representative businesses/templates.
16. Relevant automated tests pass.
17. Lint, type checking, and production build pass.
18. Project documentation explains how to run the application and the major architecture established in this phase.

The repository must be left in a clean, runnable state ready for Goal 2.

---

# `/goal 2` — Public Action Page, Module Rendering System, and Core Customer Actions

## Objective

Build the customer-facing product.

At the end of this goal, every published business should have a fast, professional, mobile-first public action page that renders its configured modules in the correct order and makes the selected primary action visually dominant.

This goal should also establish the reusable rendering architecture for all current and future small tools.

Implement the simpler customer actions fully:

- Call
- WhatsApp
- Save Contact
- FAQ
- Trust display
- Service Area display

The Quote, Pricing, Review, and advanced module behavior can remain partially implemented until their dedicated goals, but their placement within the public-page architecture should already be established.

---

## Public Page Philosophy

The page is not a mini traditional website.

It is an action surface.

A typical page should feel conceptually similar to:

- Business identity
- Trust/service-area summary
- Primary CTA
- Call / WhatsApp
- Pricing
- Service Area
- Trust
- FAQ
- Review
- Save Contact

There should be almost no conventional navigation.

Do not create menus such as:

- Home
- About
- Services
- Gallery
- Contact

The public page should simply present useful actions in a deliberate order.

---

## Public Page Routing

Use the slug system established in Goal 1.

Requirements:

- Published businesses are accessible through their public slug.
- Unpublished businesses must not expose a normal public page.
- Missing/invalid slugs should produce appropriate 404 behavior.
- Public-page data loading should be efficient.
- Do not expose sensitive dashboard-only information.
- Avoid leaking private lead or account data into page payloads.

Where the framework supports it appropriately, use caching or rendering optimizations without making publishing behavior confusing.

---

## Mobile-First Design

Treat mobile as the primary customer device.

The page should be comfortable on narrow screens before optimizing desktop.

Prioritize:

- Large tap targets
- Primary CTA visible early
- Clear Call and WhatsApp actions
- Fast rendering
- Minimal navigation
- Short sections
- Strong hierarchy
- Accessible typography
- Good contrast
- No horizontal scrolling
- Useful sticky behavior only if it genuinely helps and does not overwhelm the page

Desktop should still look intentional rather than being a stretched mobile layout.

---

## Public Business Identity

Display:

- Logo where available
- Business name
- Short description
- Relevant top-level trust/service-area summary
- Brand colour in a controlled way

Do not allow arbitrary custom CSS.

The platform controls layout, typography, spacing, and component behavior.

Business configuration may influence only safe controlled properties such as:

- Logo
- Brand colour
- Content
- Enabled modules
- Module order
- Primary action

Use safe colour handling so a badly chosen brand colour does not make text unreadable.

---

## Primary CTA

Every business has exactly one Primary Action.

Render it as the visually dominant conversion control.

For most businesses:

> Get a Quote

Secondary actions should visually support rather than compete with it.

Resolve the CTA from supported module/action types rather than storing arbitrary executable links.

If the configured Primary Action becomes unavailable because its module is disabled, handle the situation predictably.

Prefer to prevent invalid configurations in the dashboard, while also implementing safe runtime fallback behavior.

---

## Module Rendering Architecture

Create a centralized module renderer.

Given a configured business module, the system should:

1. Validate the module type.
2. Validate its configuration.
3. Determine whether it is enabled.
4. Render the appropriate platform-controlled customer component.
5. Respect configured display order.
6. Handle incomplete optional configuration safely.
7. Avoid crashing the entire page if one module configuration is invalid.

Do not implement modules as arbitrary user-defined blocks.

The architecture can be extensible internally while the UI remains purpose-built.

Each module should have clearly separated concepts where useful:

- Business-side configuration
- Validated persisted configuration
- Public-side renderer
- Analytics event names
- Shared utilities

---

## Call Action

Implement Call as a simple customer action.

Business side:

- Use the stored business phone number.
- Allow module enable/disable.
- Allow a sensible display label if already supported by the architecture, but avoid unnecessary customization.

Customer side:

- Show a clear Call Now action.
- Use an appropriate `tel:` destination.
- Track the action later through the analytics architecture without blocking navigation.
- Handle missing phone configuration gracefully.

The platform does not operate a phone system.

---

## WhatsApp Action

Business side:

- Use the stored WhatsApp number.
- Support an optional prefilled message.
- Normalize the WhatsApp destination into the required international format.
- Validate numbers sufficiently to prevent obviously broken links.

Customer side:

- Show WhatsApp as a secondary action.
- Open the appropriate WhatsApp destination.
- Preserve the configured prefilled message.
- Avoid internal messaging infrastructure.

Add unit tests around number normalization and link generation because this is easy to get subtly wrong.

---

## Save Contact / vCard

Implement Save Contact as a very small utility.

Use information already stored in the Business Profile:

- Business name
- Phone
- Email
- Website

Allow an optional contact display name if the product architecture supports it.

Example:

> 🚨 ABC Plumbing

Customer side:

- Show a Save Our Number action.
- Generate a standards-compatible vCard/contact file.
- Let the device handle saving the contact.
- Do not create a proprietary address-book system.

Validate output escaping and special characters.

---

## FAQ

Business side:

- Support a list of questions and answers.
- Support defaults created by industry templates.
- Allow adding, editing, deleting, and ordering questions.
- Keep the editor simple.
- Set sensible content-length limits.

Customer side:

- Render questions as a clean expandable list/accordion.
- Ensure keyboard accessibility.
- Do not introduce chatbot or AI behavior.

---

## Trust / Credentials — Display Layer

Goal 4 will finish the complete Trust configuration and upload system.

In this goal, establish the core Trust rendering model.

Public examples:

- Licensed Contractor
- Fully Insured
- 5-Year Workmanship Warranty
- Certified Installer

The purpose is customer confidence, not document management.

Render entries clearly and conservatively.

Do not imply that the platform independently verified a credential unless a future verification product actually exists.

---

## Service Area — Display Layer

Goal 4 will add the complete editing/checking experience.

In this goal:

- Render configured cities/areas.
- Render optional postal-code information where appropriate.
- Create the visual structure for a future "Do you serve my postcode?" check.

Do not implement maps.

Do not use:

- Geocoding
- Radius calculations
- Polygons
- Driving distance
- Map providers

---

## Performance and Accessibility

The public page is the most important customer-facing route.

Audit:

- Core Web Vitals where practical
- Image sizing
- Logo loading
- JavaScript payload
- Form/component hydration
- Font loading
- Accessible names
- Keyboard behavior
- Colour contrast
- Focus states
- Semantic headings
- Accordion behavior

Avoid loading dashboard-only libraries on public pages.

---

## Search and Sharing Metadata

Add sensible public-page metadata:

- Business name
- Short description
- Canonical handling if appropriate
- Open Graph metadata
- Social sharing metadata
- Favicon/platform metadata where relevant

Do not make SEO into a major subsystem.

The primary product is an action page reached from other discovery channels.

---

## Goal 2 Explicit Exclusions

Do not complete:

- Quote processing backend
- Upload processing
- Lead email delivery
- Advanced pricing logic
- Review asset generation
- Analytics dashboard
- Interactive service-area checks beyond what is appropriate for the architecture

Do not build:

- Conventional site navigation
- Arbitrary sections
- User-authored pages
- Page builder
- Theme editor
- Custom CSS
- Custom HTML
- Internal chat
- Booking widgets
- Payment widgets

---

## Goal 2 Definition of Done

This goal is complete when:

1. Every published business has a public action page.
2. The page is genuinely mobile-first.
3. Business identity renders correctly.
4. Brand colour is applied safely.
5. Module ordering comes from business configuration.
6. Disabled modules do not render.
7. The selected Primary CTA is visually dominant.
8. Call works.
9. WhatsApp works.
10. Prefilled WhatsApp messages work.
11. Save Contact generates a valid contact file.
12. FAQ configuration and public rendering work.
13. Trust information has a clean customer-facing presentation.
14. Service Area has a clean customer-facing presentation.
15. Missing optional configuration is handled gracefully.
16. Accessibility is meaningfully addressed.
17. Public-page performance is reasonable.
18. Relevant unit/integration tests pass.
19. Production build passes.

The application should already feel like a usable customer-facing product before moving to Goal 3.

---

# `/goal 3` — Quote Request System, Photo Uploads, Lead Storage, Security, and Email Delivery

## Objective

Build the complete Quote Request system.

This is one of the core V1 conversion features.

At the end of this goal, a business should be able to configure a constrained industry-appropriate quote form, a customer should be able to submit a quote request with optional photos, the request should be validated and stored safely, the business should receive an immediate transactional email, and the request should appear in dashboard history.

The business must never be required to continually watch the SaaS dashboard in order to discover new leads.

> **Email notification is the primary delivery mechanism.**

---

## Quote Form Philosophy

The Quote Request tool is configurable, but it is **not** a general-purpose form builder.

The platform supports a deliberately constrained set of field types.

Initial supported field types:

- Text
- Number
- Dropdown
- Multiple choice
- Checkbox
- Address/postcode
- Contact details
- Photo upload

Do not allow:

- Arbitrary HTML
- Scripts
- Complex conditional logic
- Nested field dependencies
- User-defined validation expressions
- Multi-page workflow builders
- General automation triggers

Keep the form model predictable enough to validate reliably on both business and customer sides.

---

## Industry Quote Templates

Templates should provide useful default forms.

Example Pressure Washing form:

### What needs cleaning?

Options:

- Driveway
- Patio
- House
- Roof
- Other

### Approximate size

Simple number/text as appropriate.

### Your postcode

Address/postcode field.

### Upload up to 3 photos

Photo field.

### Your name

Contact field.

### Phone or email

Contact information.

Other industries should receive sensible defaults appropriate to their likely customer journey.

A plumber might ask about:

- Type of plumbing issue
- Emergency or normal service
- Property postcode
- Short description
- Optional photos
- Customer contact information

Do not attempt to perfectly model every trade.

The purpose of templates is to provide a strong starting point.

---

## Business-Side Quote Form Configuration

Create a controlled quote editor.

The owner should be able to:

- View template fields
- Edit field label
- Edit supported choices
- Mark supported fields required/optional
- Reorder fields
- Add a supported field type
- Remove unnecessary fields
- Configure simple helper text where useful

Keep the editor constrained.

Do not expose raw schema or code.

Protect against dangerous or broken configurations.

Validate configuration before saving.

---

## Public Quote Form

The customer form must:

- Match the public page design
- Be optimized for mobile
- Clearly explain required fields
- Preserve entered values when recoverable validation errors occur
- Support accessible labels
- Provide useful upload feedback
- Prevent double submission where practical
- Provide a clear success state
- Provide safe error behavior when the server or email system has trouble

Do not make the form feel like a long enterprise intake process.

Templates should help keep forms concise.

---

## Server-Side Validation

All submissions must be validated on the server.

Do not rely on client validation.

Validate:

- Business exists
- Business is published
- Quote module is enabled
- Submitted fields correspond to allowed form configuration
- Required fields are present
- Values match expected field type
- Choice values belong to configured options
- Text lengths
- Number ranges where configured
- Contact details
- Upload count
- Upload size
- Upload type

Reject unexpected fields where practical.

Do not blindly persist arbitrary customer-provided JSON.

---

## Photo Uploads

Initial quote uploads should support:

- Maximum 3 photos
- Maximum 5 MB per photo
- JPG
- PNG
- WebP

Use strict server-side validation.

Do not trust:

- Filename extensions
- Browser-declared MIME type alone
- Client-side checks alone

Use safe storage keys.

Avoid public write access.

Store only what is required.

If the chosen object storage supports private objects with controlled access, prefer that model.

Avoid exposing permanent public URLs for private customer lead photos without a reason.

Consider image metadata/privacy implications.

Do not add image editing or media-management features.

---

## Credential/File Infrastructure Reuse

Design upload infrastructure so Goal 4 can reuse the safe primitives for optional credential files.

Do not build a generic document-management product.

The objective is merely to avoid implementing the same security-sensitive upload plumbing twice.

---

## Lead Persistence

Persist the quote submission before depending on external email delivery.

A quote record should contain enough information to:

- Identify business
- Record submission time
- Preserve answers
- Preserve contact information
- Reference uploaded photos
- Show the request later in dashboard history
- Support safe email retry/diagnostics if needed

Keep the schema understandable.

Avoid inventing CRM fields such as:

- Lead stage
- Sales owner
- Pipeline
- Deal value
- Follow-up status
- Opportunity probability
- Automated sequences

The dashboard stores quote-request history, not a sales pipeline.

---

## Transactional Email Delivery

When a valid customer quote is submitted:

1. Store the lead.
2. Store/reconcile uploads.
3. Trigger transactional email to the business.
4. Record delivery attempt/status as needed for reliability.
5. Return a customer success response without requiring the email provider itself to be the source of truth for the lead.

Email content should contain the useful lead information directly.

Example structure:

**New quote request**

John Smith  
Driveway cleaning  
Approximately 800 sq ft  
Postcode: 33301  

3 photos attached/linked appropriately  

Phone: ...  
WhatsApp: ...  
Email: ...

The owner should be able to understand the request from the email without logging into the SaaS dashboard.

Use safe links or attachments based on provider/storage constraints.

Do not expose customer uploads insecurely just to simplify the email.

---

## Email Failure Handling

Lead persistence must not fail merely because the transactional email provider has a temporary issue.

Implement the simplest reliable mechanism suitable for the architecture.

Possibilities include:

- Retry queue
- Database-backed delivery job
- Provider retry support
- A small background-job mechanism
- Explicit failed-delivery state with admin/log visibility

Do not introduce an enormous distributed job system if a simple solution is sufficient.

At minimum, failures should be observable.

Do not silently drop email notifications.

---

## Quote History

Add quote history to the business dashboard.

The owner should be able to:

- See recent quote requests
- Open a request
- See submission time
- See answers
- See customer contact information
- View allowed uploaded photos
- Understand whether email delivery encountered an issue if that information is useful

Keep this deliberately simple.

Do not add:

- Lead stages
- Assignments
- Notes systems
- Follow-up automation
- Customer timeline
- Pipeline views
- Kanban
- Sales dashboards

---

## Spam and Abuse Protection

Public quote forms require protection.

Implement:

- Bot protection
- Basic rate limiting
- Server-side validation
- Upload limits
- Submission-size limits
- Sensible request limits
- Protection against repeated obvious abuse

Choose tooling appropriate to the existing stack.

Do not make legitimate quote submission unnecessarily difficult.

Avoid requiring accounts for customers.

---

## Security

Audit the complete path:

- Form configuration ownership
- Quote submission endpoints
- Upload endpoints
- Object access
- Dashboard quote access
- Cross-business authorization
- Input validation
- Output escaping
- Filename handling
- Request limits
- CSRF protections where applicable
- Secure secrets
- Provider credentials

Ensure one business owner can never retrieve another business's leads or files through guessed IDs.

---

## Analytics Hooks

Create or integrate event hooks for:

- Quote form opened if useful
- Quote submitted

The main V1 metric is Quote submissions.

Full analytics presentation will be completed in Goal 5.

Do not block quote submission on analytics recording.

---

## Goal 3 Explicit Exclusions

Do not build:

- Quote acceptance
- Quote versions
- Customer-specific quote links
- Quote expiry
- Contract acceptance
- Electronic signatures
- Estimate approval
- Payments
- Invoicing
- CRM pipeline
- Lead assignment
- Automated follow-ups
- Customer messaging
- SMS delivery
- Automated WhatsApp messages
- Appointment booking

---

## Goal 3 Definition of Done

This goal is complete when:

1. Industry templates can provide quote-form defaults.
2. Business owners can edit forms within supported constraints.
3. Public forms render correctly.
4. All fields are validated server-side.
5. Up to 3 supported photos can be uploaded.
6. File limits are enforced.
7. Files are stored safely.
8. Spam protection exists.
9. Rate limiting exists.
10. Valid submissions are persisted.
11. Transactional email is triggered immediately.
12. Temporary email failure does not delete the lead.
13. Failed delivery is observable/retriable appropriately.
14. Quote history appears in the dashboard.
15. Owners can view their own submissions and files.
16. Cross-business access is prevented.
17. Customer success/error states are clear.
18. Quote-submission analytics hooks exist.
19. Critical tests cover validation, authorization, uploads, and the complete submission flow.
20. Production build and checks pass.

The most important end-to-end journey must work:

Customer opens business page  
→ selects Get a Quote  
→ fills in form  
→ uploads photos  
→ submits  
→ lead is stored  
→ business receives email  
→ lead appears in business dashboard.

---

# `/goal 4` — Pricing, Service Area, Trust/Credentials, and Complete FAQ Configuration

## Objective

Complete the main supporting decision-making tools that help customers decide whether to contact the business.

This goal should finish:

- Pricing
- Service Area
- Trust / Credentials
- FAQ configuration refinement

These tools support the Primary CTA rather than becoming standalone workflow products.

A good implementation should make a public page answer:

- Roughly what might this cost?
- Do you serve my location?
- Can I trust you?
- What common questions do you already answer?
- What should I do next?

---

## Pricing Module

General Pricing and the Simple Price Estimator are one underlying module.

Do not implement separate unrelated pricing products.

The business selects how sophisticated the pricing presentation should be.

### Mode A — Price List

Support a simple list of services/items.

Example:

**Drain Cleaning**  
From $120

**Emergency Callout**  
From $180

**Water Heater Installation**  
From $850

Business configuration should support:

- Item/service name
- Display price
- Optional short description
- Ordering
- Add/edit/delete
- Currency/business-level formatting if needed by the existing architecture

Do not attempt full international accounting behavior unless already established by the project.

### Mode B — Simple Estimate

Support intentionally simple calculations.

Examples:

**Base driveway cleaning**  
$120

Add-ons:

- Oil treatment +$40
- Sidewalk +$30
- Patio +$60

Result:

> Estimated price: $220

Also support straightforward quantity pricing such as:

> $8 × number of windows

The supported pricing primitives should remain explicit and controlled.

A sensible model may include:

- Base amount
- Fixed optional add-ons
- Single quantity × unit price
- Simple combination of the above if implementation stays understandable

Do not create a formula language.

---

## Pricing Exclusions

Do not support:

- Arbitrary mathematical expressions
- Nested conditional formulas
- Spreadsheet logic
- User-authored code
- Complex dependent pricing tiers
- Multiple interdependent variables
- Discount engines
- Tax engines
- Quoting/invoicing workflows

If the price cannot be represented simply, the business should be able to display:

> From $150

and direct the customer toward:

> Request Exact Quote

---

## Pricing Customer Experience

The customer should either:

- See the price list, or
- Make a few simple selections

Then show the result clearly.

Every estimate should communicate that it is an estimate rather than a binding quote where appropriate.

End with an action such as:

> Get Exact Quote

This should connect naturally to the business's Primary CTA / Quote Request module.

If possible, pass relevant pricing context into the quote flow without creating complex cross-module state.

Example:

A customer estimated driveway cleaning with Oil Treatment + Patio.

The quote form may receive a short summary of those selections.

Keep this simple and optional.

---

## Service Area Module

The first version does not require maps.

### Business Side

Allow the owner to define areas served.

Support:

- Cities/areas
- Optional postal codes

Example:

Cities:

- Fort Lauderdale
- Hollywood
- Davie
- Plantation
- Weston

Avoid requiring exact GIS information.

### Customer Side

Display:

> Areas We Serve

and the configured area list.

Optionally allow the customer to enter a postcode:

> Do you serve 33324?

Check the customer input against the business's configured postal-code list.

Return a clear result such as:

- Yes, we serve this postcode.
- This postcode is not currently listed. Contact us to check.

Avoid making a negative postcode match sound like an absolute rejection if the product/business configuration may be incomplete.

---

## Service Area Normalization

Implement practical normalization appropriate to the initial markets supported by the product.

At minimum:

- Trim whitespace
- Normalize case where relevant
- Normalize straightforward postal-code formatting where safe

Do not attempt to build a universal address intelligence platform.

Keep comparison logic transparent and testable.

---

## Service Area Exclusions

Do not implement:

- Geocoding
- Interactive maps
- Polygon drawing
- Radius search
- Travel-distance calculation
- Driving-time calculation
- Map-provider integration
- Automatic city detection
- GIS database

A proper map can be considered later only if real customers demonstrate that it is needed.

---

## Trust / Credentials Module

Licence, insurance, certification, and warranty information should remain one **Trust** module.

### Business Side

Allow the owner to add trust entries such as:

**Licensed Contractor**  
Licence #123456

**Insured**  
$2M liability insurance

**Workmanship Warranty**  
5 years

**Certified Installer**  
Manufacturer certification

Each entry may contain:

- Name
- Short description
- Reference number
- Expiry date
- Optional supporting image/document

Use strong defaults and concise forms.

---

## Trust Uploads

Reuse the secure file infrastructure created in Goal 3.

Supporting documents are optional.

The module is not a document-management platform.

Enforce:

- Allowed types
- File size limits
- Safe storage
- Ownership
- Secure access where files are not intended to be public

Decide carefully whether supporting evidence should be publicly downloadable or simply represented visually.

Do not accidentally expose sensitive insurance/licensing documents by default.

If public evidence is supported, require explicit owner intent.

---

## Trust Customer Experience

Public display should be clean and confidence-oriented.

Examples:

- ✓ Licensed Contractor
- ✓ Fully Insured
- ✓ 5-Year Workmanship Warranty
- ✓ Certified Installer

Optional additional details can be expandable.

Avoid implying platform verification.

For example, do not label something "Verified by Platform" unless the platform actually performs a verification process.

---

## Expiry Handling

If an owner supplies an expiry date:

- Persist it correctly.
- Show useful owner-side context.
- Avoid presenting an expired credential exactly like an active one.

Keep behavior simple.

Potential safe behavior:

- Warn the owner in the dashboard when a credential is expired.
- Hide the public "active" trust indicator for expired credentials or clearly mark it according to product decision.

Do not build renewal workflows or notifications in this goal unless trivial and clearly justified.

---

## FAQ Completion

Finish FAQ management if Goal 2 only established basic behavior.

Business side:

- Industry template defaults
- Add
- Edit
- Delete
- Reorder
- Sensible field length limits
- Clear preview

Customer side:

- Accessible accordion
- Fast interaction
- Clean display
- No chatbot
- No AI answering system

Templates can preload common questions.

Example Plumbing questions:

- Do you offer emergency service?
- Do you charge a callout fee?
- Do you work weekends?
- What payment methods do you accept?

The owner should be able to modify them easily.

---

## Dashboard Integration

Each of these modules should have a coherent configuration experience from the dashboard.

Avoid a collection of unrelated settings pages with different design conventions.

Use consistent patterns for:

- Edit
- Save
- Cancel
- Reorder
- Enable/disable
- Validation
- Preview where useful

Do not introduce a generic admin builder to unify them.

Purpose-built module configuration is acceptable and often preferable.

---

## Goal 4 Explicit Exclusions

Do not build:

- Advanced calculator
- Formula language
- Conditional pricing engine
- Quote generation
- Tax calculation
- Payments
- Maps
- Geocoding
- GIS
- Credential verification service
- Document-management workflow
- Renewal management system
- AI FAQ
- Customer chat

---

## Goal 4 Definition of Done

This goal is complete when:

1. Pricing supports simple Price List mode.
2. Pricing supports Simple Estimate mode.
3. Base/add-on pricing works.
4. Quantity × unit pricing works.
5. Complex formulas are impossible by design.
6. Estimate results can direct customers toward Get Exact Quote.
7. Service areas can be configured.
8. Cities/areas display publicly.
9. Optional postal-code matching works.
10. No map/geocoding infrastructure exists.
11. Trust entries can be created and managed.
12. Optional Trust supporting files use safe upload infrastructure.
13. Expired credentials are handled appropriately.
14. Public Trust presentation is confidence-oriented without false verification claims.
15. FAQ management is complete.
16. All module configuration respects authorization.
17. Relevant calculations and normalization logic have unit tests.
18. Public and dashboard integration tests pass.
19. Production checks pass.

---

# `/goal 5` — Review Kit, Business Page QR, Review QR, Analytics, and Dashboard Activity

## Objective

Complete the remaining high-value V1 utilities and give the business owner enough feedback to understand whether customers are actually using the page.

This goal includes:

- Review action
- Review QR
- Business Page QR
- Fixed Review Kit assets
- Lightweight analytics collection
- Last 30 Days summary
- Recent Activity

The product should remain small.

Review Kit must not become design software.

Analytics must not become an analytics platform.

---

## Review Action

Use the Google review URL stored in the Business Profile.

Public customer page:

> ⭐ Leave Us a Review

The action should open the configured destination.

Track the click without delaying or breaking navigation.

If no review URL is configured, the action should not appear publicly.

Provide dashboard validation so the owner can test the destination.

---

## Review QR

Generate a QR code pointing directly to the configured review URL.

The business should be able to:

- View the QR
- Download the QR
- Download it at useful print quality

Ensure QR output remains scannable.

Use adequate quiet zone/contrast.

Do not allow brand styling that breaks reliability.

---

## Business Page QR

Every business page should automatically have a distinct QR code.

This QR opens the full public action page.

Do not confuse it with the Review QR.

Business Page QR:

> Opens the complete action page.

Review QR:

> Opens the Google review destination.

The owner should be able to download both.

Business Page QR is useful for:

- Vehicles
- Business cards
- Flyers
- Invoices
- Physical signage

---

## Fixed Review Kit Assets

Generate one or two useful branded outputs.

Initial examples:

### Printable Review Sign

Concept:

> How did we do?

> Scan to review ABC Plumbing on Google.

> [QR]

### Social Review Graphic

A simple branded graphic containing:

- Business name
- Logo where available
- Brand colour
- Short review CTA
- Review QR if appropriate for the asset

Use fixed platform-controlled layouts.

Automatically insert:

- Business logo
- Business name
- Brand colour
- QR

Do not build design editing controls.

---

## Review Kit Exclusions

There should initially be:

- No graphic editor
- No drag-and-drop canvas
- No arbitrary text positioning
- No hundreds of templates
- No typography designer
- No general print-design system

The feature is:

> Generate useful ready-made review material.

It is not:

> Design marketing materials.

---

## Asset Generation

Implement output generation reliably.

Consider:

- PNG
- Print-friendly PDF if straightforward and useful
- High-resolution raster output

Do not add unnecessary formats.

Ensure:

- Logos preserve aspect ratio
- Brand colours remain readable
- QR remains scannable
- Long business names do not destroy the layout
- Missing logos produce an intentional fallback
- Downloads have sensible filenames

Add representative tests or rendering fixtures where practical.

---

## Analytics Philosophy

V1 analytics should answer one question:

> **Are customers actually using my page?**

Track only the important actions.

Core events:

- Page visitor/page view
- Quote submission
- Call click
- WhatsApp click
- Review click

Potentially include Save Contact if the event architecture already supports it cleanly, but do not let metric expansion distract from the core set.

Do not create dozens of event types.

---

## Event Data Model

Create a lightweight event model.

Store only what is needed to calculate basic activity.

Possible fields:

- Business ID
- Event type
- Timestamp
- Minimal anonymous request/context information where genuinely useful

Minimize personal data.

Avoid storing unnecessary:

- Full IP history
- Fingerprints
- Session recordings
- Detailed navigation trails
- Behavioral profiles

If bot/rate-limit systems need transient request information, do not automatically turn that information into permanent analytics data.

---

## Page View Counting

Define what counts as a page visit.

Aim for a useful approximate business metric rather than enterprise-grade analytics accuracy.

Consider obvious crawler/bot filtering where inexpensive.

Do not spend large engineering effort creating perfect unique-visitor attribution.

If using server rendering, middleware, or client events, choose an approach that:

- Does not significantly harm page performance
- Avoids obvious duplicate counting where practical
- Respects privacy
- Works with deployment/caching architecture

Document the chosen semantics.

---

## Action Click Tracking

Track:

- Call
- WhatsApp
- Review

Tracking must never prevent the action.

If analytics recording fails, the customer should still reach the destination.

Use reliable non-blocking event behavior.

Do not introduce redirects that create noticeable delay unless technically necessary and tested.

---

## Quote Conversion Tracking

Quote submissions are authoritative events from Goal 3.

Use stored successful submissions to drive the Quote Request metric where possible rather than trusting client-side clicks.

Avoid double-counting.

---

## Last 30 Days Dashboard

Add a compact summary.

Conceptually:

### Last 30 Days

243 visitors

19 quote requests

38 call / WhatsApp clicks

11 review clicks

The exact layout should match the existing dashboard design system.

Prioritize clarity over charts.

A simple number + label presentation may be better than chart-heavy analytics.

---

## Recent Activity

Provide a small recent-activity area.

Examples:

- New quote request
- Call action clicked
- WhatsApp action clicked
- Review action clicked

Avoid a noisy activity feed.

Do not imply that click events necessarily became successful calls/messages/reviews.

Use accurate language.

For example:

- "Call button clicked"
- not "Customer called"

The platform only knows the action was clicked.

---

## Analytics Exclusions

Do not implement:

- Attribution
- Marketing source tracking
- Funnels
- Heatmaps
- Session recording
- User replay
- Customer fingerprinting
- Complex visitor identity
- Revenue reporting
- Conversion cohorts
- A/B testing
- Advanced exports
- Custom dashboards
- Report builders

More analytics should only be added if businesses demonstrate actual need.

---

## Privacy

Analytics should align with the product principle of minimizing stored customer information.

Review:

- Data retention
- IP handling
- Cookies
- Consent requirements based on the implemented approach
- Privacy disclosure
- Analytics provider behavior if an external provider is used

Prefer first-party lightweight analytics if that is reasonable in the current architecture.

Do not add a surveillance-oriented analytics vendor simply because it is convenient.

---

## Goal 5 Definition of Done

This goal is complete when:

1. Public Review action works.
2. Review clicks are tracked.
3. Review QR is generated.
4. Review QR can be downloaded in useful quality.
5. Every published business has a Business Page QR.
6. Business Page QR can be downloaded.
7. The two QR purposes are clearly distinguished.
8. At least one printable Review Kit asset works.
9. At least one additional branded Review Kit asset works if practical.
10. Assets use fixed platform templates.
11. Assets handle long names/missing logos safely.
12. Page visits are tracked.
13. Call clicks are tracked.
14. WhatsApp clicks are tracked.
15. Quote submissions feed analytics correctly.
16. Last 30 Days dashboard works.
17. Recent Activity works.
18. Tracking does not interfere with customer actions.
19. Analytics data remains deliberately minimal.
20. No advanced analytics or graphic editor has been introduced.
21. Tests and production checks pass.

---

# `/goal 6` — Production Hardening, End-to-End Testing, UX Polish, Privacy, Operations, and Private-Beta Readiness

## Objective

Do not add significant new product scope.

Treat the existing application as a product that is about to be given to real local service businesses and their real customers.

Audit and harden the complete system.

The final result should be suitable for a manually managed private beta.

Billing does not need to dictate this phase.

---

## Full End-to-End Product Journey

The following journey must work as one coherent system:

Create account  
→ choose industry  
→ receive preconfigured toolkit  
→ enter business profile  
→ edit modules  
→ choose Primary CTA  
→ publish  
→ copy public URL  
→ download/scan Business Page QR  
→ open public page on mobile  
→ inspect pricing  
→ check service area  
→ inspect trust information  
→ open FAQ  
→ submit quote with photos  
→ quote persists  
→ owner receives transactional email  
→ owner sees quote in dashboard  
→ analytics updates  
→ customer can Call  
→ customer can open WhatsApp  
→ customer can leave a Google review  
→ customer can Save Contact.

Test this flow repeatedly with representative businesses.

At minimum include:

- Plumbing
- HVAC
- Pressure Washing
- Cleaning

---

## UX Audit — Business Side

Review the dashboard and onboarding as a real owner-operated business user.

Look for:

- Confusing terminology
- Repeated data entry
- Unnecessary fields
- Poor defaults
- Broken template assumptions
- Dead-end screens
- Missing save feedback
- Ambiguous publish state
- Hard-to-find public URL
- Tool configuration inconsistency
- Poor mobile behavior
- Weak empty states
- Weak loading states
- Weak error states

The dashboard should remain something the owner configures occasionally.

It should not feel like software they must constantly monitor.

---

## UX Audit — Public Customer Page

Test on realistic mobile viewports and devices where possible.

Review:

- Page load speed
- First-screen clarity
- Primary CTA dominance
- Tap targets
- Call/WhatsApp usability
- Form ergonomics
- Photo upload
- Pricing estimator
- Service-area check
- Trust presentation
- FAQ behavior
- Review action
- Save Contact
- Long content
- Missing optional content
- Long business names
- Different logo shapes
- Brand-colour extremes

Avoid adding visual complexity merely to make the page feel more "website-like."

---

## Accessibility

Perform a meaningful accessibility pass.

Check:

- Keyboard navigation
- Focus order
- Focus visibility
- Form labels
- Validation announcements
- Accordion semantics
- Button/link semantics
- Colour contrast
- Heading hierarchy
- Alt text
- Modal/dialog behavior if any
- Touch target size
- Reduced-motion considerations where relevant

Fix genuine problems.

Do not treat accessibility as a checkbox-only exercise.

---

## Validation and Error Handling

Review every user-input boundary.

Business side:

- Profile
- Slug
- Templates
- Module configuration
- Quote-form configuration
- Pricing configuration
- Service area
- Trust entries
- FAQ
- Review URL
- Uploads

Customer side:

- Quote form
- Photos
- Postcode checking
- Public action links

Ensure error states:

- Explain what went wrong
- Preserve valid entered data where practical
- Do not leak stack traces or sensitive implementation details
- Do not silently fail

---

## Authorization Audit

Review every route/action/API that accesses business-owned data.

Test deliberately:

- User A attempting to access User B's business
- User A attempting to access User B's quote
- User A attempting to access User B's uploads
- Guessing record IDs
- Editing module IDs belonging to another business
- Accessing unpublished business management routes
- Manipulating public identifiers

Authorization must be enforced server-side.

Add tests for important ownership boundaries.

---

## Upload Security Audit

Review quote and credential uploads.

Verify:

- Size limits
- Count limits
- Type detection
- Extension handling
- Storage permissions
- Object keys
- Public/private access
- Download authorization
- Dangerous content handling
- Cleanup behavior
- Orphaned uploads
- Failed submission cleanup where appropriate

Do not broaden supported file types just for convenience.

---

## Spam and Rate-Limit Audit

Test:

- Quote form repeated submissions
- Large request bodies
- Upload abuse
- Bot-protection failure behavior
- Rate-limit behavior
- Legitimate users behind shared networks where relevant

Ensure abuse protection does not create unreasonable friction for normal customers.

---

## Email Reliability

Audit transactional quote email.

Verify:

- Correct destination
- Correct reply/contact information where appropriate
- Safe rendering
- Useful subject lines
- Uploaded-photo access
- Delivery retries
- Failure visibility
- Idempotency/duplicate avoidance where relevant

The core product promise depends on the owner noticing leads quickly.

Treat this as production-critical.

---

## Database Review

Review:

- Constraints
- Foreign keys
- Indexes
- Unique constraints
- Cascade behavior
- Deletion behavior
- Timestamp behavior
- Slug uniqueness
- Event-query performance
- Quote history performance

Avoid premature optimization, but fix obvious production issues.

Ensure migrations can create the application from a clean database.

---

## Data Deletion and Retention

Define reasonable behavior for:

- Business deletion
- Account deletion
- Quote data
- Uploaded photos
- Credential files
- Analytics events

The original product principle is to minimize customer information stored.

Do not retain data indefinitely without considering why it exists.

If full self-service deletion is not implemented for private beta, document the operational process clearly.

---

## Logging and Error Reporting

Add production-appropriate visibility.

At minimum:

- Application errors
- Failed quote emails
- Upload failures
- Important server errors
- Authentication failures where useful
- Unexpected analytics processing failures

Do not log sensitive customer data unnecessarily.

Never log:

- Passwords
- Auth secrets
- Full sensitive tokens
- Private upload credentials

Be cautious about logging full quote contents.

---

## Operational Documentation

Document:

- Required environment variables
- Local setup
- Database setup
- Migrations
- Seed data
- Object-storage configuration
- Email-provider configuration
- Bot-protection configuration
- Production build
- Deployment assumptions
- Backup approach
- Troubleshooting common failures

A new developer should be able to run the project without reverse-engineering hidden setup steps.

---

## Test Strategy

Use automated tests where they provide meaningful protection.

### Unit Tests

Prioritize:

- Template generation
- Module configuration validation
- Primary CTA resolution
- Slug handling
- WhatsApp normalization
- vCard generation
- Quote-form validation
- Pricing calculations
- Service-area matching
- Upload validation
- Analytics-event logic
- Authorization helpers

### Integration Tests

Prioritize:

- Authentication
- Business creation
- Template application
- Publishing
- Module configuration
- Quote persistence
- Email job creation/delivery path
- Upload access
- Analytics aggregation

### End-to-End Tests

At minimum cover the critical path:

Account creation  
→ choose Plumbing  
→ configure business  
→ publish  
→ public page  
→ submit quote  
→ lead stored  
→ dashboard history.

Where the test environment permits, also verify:

- Pricing
- Service area
- Call/WhatsApp link generation
- Review destination
- QR generation/download

Do not pursue superficial 100% coverage.

Focus on high-value behavior.

---

## Performance

Audit the public page especially.

Check:

- Database query count
- N+1 behavior
- Public payload size
- Image sizes
- Logo optimization
- JavaScript bundle size
- Client hydration
- Analytics overhead
- Quote-form performance
- QR/asset generation behavior

Do not load dashboard-only libraries on public routes.

Aim for a fast experience on ordinary mobile networks.

---

## SEO and Sharing

Ensure public pages have sensible metadata.

Review:

- Title
- Description
- Open Graph
- Social preview
- Canonical handling where appropriate
- Indexing behavior for published vs unpublished businesses

Do not turn this into an SEO-management suite.

Businesses should not receive advanced SEO controls in V1.

---

## Privacy and Legal Surfaces

The application should publish clear places for:

- Privacy information
- Terms

Do not assume a footer link alone makes the application legally compliant.

Document what personal data is stored.

At minimum consider:

- Business-owner account data
- Quote requester contact data
- Uploaded customer photos
- Analytics events
- Authentication/session data

Minimize data collection wherever possible.

Avoid making unsupported legal claims in the product.

Use placeholders for jurisdiction-specific legal review where necessary rather than inventing legal compliance text.

---

## Billing

Billing does not need to dictate V1 development.

A private beta can be manually managed.

Do not build a complex subscription system in this goal unless billing already exists in the repository and merely needs production hardening.

Self-service subscription checkout can be added later.

---

## Private Beta Administration

Provide only the minimal operational controls needed to run a private beta.

Prefer simple internal/admin mechanisms.

Do not build a large admin product.

Possible needs:

- View businesses
- Identify account owner
- See publish state
- Diagnose failed lead emails
- Disable abusive account
- Basic support troubleshooting

If existing internal tooling already handles this, reuse it.

---

## Final V1 Scope Audit

Before completion, compare the implementation against the product boundaries.

Explicitly confirm that the application has **not accidentally become**:

- A website builder
- A CRM
- An invoicing product
- A payment system
- A booking platform
- A scheduling platform
- A staff-management tool
- A communications platform
- A marketing automation suite
- A document-signing platform
- A general form builder
- A general graphic-design tool

Remove or simplify unnecessary features that push the application toward those categories.

---

## Features That Must Remain Out of V1

Do not add:

### Quote Acceptance

No:

- Quote versions
- Acceptance state
- Terms acceptance
- Expiry
- Customer quote portals
- E-signatures

### QuickCal / Booking

No:

- Availability engine
- Staff calendars
- Booking system
- Appointment workflow

### Calendar Reminder

Keep this for V1.1.

Future concept:

> Remind me to service this AC in six months.

The future implementation should preferably hand off to the customer's own calendar rather than create a notification platform.

### Advanced Pricing

No:

- Formula language
- Conditional rules
- Spreadsheet logic

### Interactive Maps

No:

- Polygons
- Radius maps
- Driving distance
- Geocoding

### Custom Domains

Not required for initial value validation.

### Automated Messaging

No:

- Automated SMS
- Automated WhatsApp messaging
- Internal customer communications

Use customer/device applications instead.

---

## Goal 6 Definition of Done

The complete V1 is ready when a new local service business can:

- Create an account
- Select its business type
- Receive a useful predefined toolkit
- Configure business information
- Configure core modules
- Choose one Primary CTA
- Publish a professional mobile-first public page
- Share the page by URL
- Share the page by QR
- Receive quote requests
- Receive quote photos
- Receive immediate quote-request email
- View quote history
- Show simple pricing
- Offer a simple price estimate
- Show service areas
- Check configured postal codes
- Show trust/credential information
- Answer FAQs
- Receive Call clicks
- Receive WhatsApp clicks
- Send customers to Google reviews
- Generate Review QR
- Generate useful fixed Review Kit assets
- Generate Business Page QR
- Provide Save Contact
- See basic usage analytics
- Operate without needing to live inside the dashboard

The application should pass:

- Formatting
- Linting
- Type checking
- Unit tests
- Relevant integration tests
- Critical end-to-end tests
- Production build

The repository should contain:

- Reproducible migrations
- Development seed data
- Environment documentation
- Operational documentation
- Clear deployment instructions
- Privacy/data-handling notes
- Production troubleshooting guidance

The final experience should feel like:

> **"That's useful. Why doesn't every local service business already have that?"**

and not:

> **"We accidentally built another CRM."**

---

# Post-V1 Direction

Do not implement the following until V1 usage demonstrates demand.

## V1.1 — Small Retention Utilities

Potential early additions:

- Calendar Reminder
- QuickCal
- Additional Review Kit assets
- Additional industry templates

These should remain small standalone utilities.

## V2 — Only If Demand Is Proven

Potential later additions:

- Quote Acceptance
- More advanced Price Estimator
- Interactive Service Area Maps
- Integrations
- More sophisticated analytics

These features introduce more state or complexity and should only be built because customers clearly need them.

---

# Core V1 Hypothesis

The purpose of this project is not to prove that the team can build many features.

It is to answer:

> **Will a local service business use this as an important customer-facing link, and will customers actually use it to contact the business?**

Everything in V1 should support testing that hypothesis.

The product is valuable because each individual tool is deliberately small.

A call link is not special.

A pricing list is not special.

A quote form is not special.

A service-area list is not special.

A review QR is not special.

A credentials section is not special.

The product is the combination of exactly the right small utilities, preconfigured for a local service business and presented through one professional action page.
