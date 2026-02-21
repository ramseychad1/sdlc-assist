# Global Technical Design Guidelines

## API Design
- All REST endpoints must follow RESTful conventions (nouns, not verbs)
- Use plural resource names: `/api/users`, not `/api/user`
- API versioning required: prefix all routes with `/api/v1/`
- HTTP status codes must be semantically correct (200, 201, 400, 401, 403, 404, 409, 500)
- All error responses must follow a consistent shape: `{ "error": "CODE", "message": "..." }`
- Paginated list endpoints must return: `{ "data": [], "total": 0, "page": 1, "pageSize": 25 }`

## Security
- All endpoints (except login/register) must require authentication
- Never return passwords, secrets, or internal system IDs in API responses
- All user inputs must be validated server-side — never trust client data
- Sensitive fields (PII, financial data) must be flagged in the data model
- CORS must be explicitly configured — do not use wildcard origins in production

## Data Model
- All tables must have a UUID primary key (`id`)
- All tables must have audit timestamps: `created_at`, `updated_at`
- Soft deletes preferred over hard deletes for user-facing entities: use `deleted_at TIMESTAMP NULL`
- Foreign keys must have explicit `ON DELETE` behavior defined
- Index all foreign key columns and columns used in frequent WHERE clauses

## Architecture
- Separate concerns: controllers handle HTTP, services handle business logic, repositories handle data
- No business logic in controllers or data access layers
- Environment-specific configuration must use environment variables — no hardcoded values
- All external service calls must have timeout and retry configuration

## Documentation
- All API endpoints must have a summary description
- All data model entities must have a purpose description
- Complex business rules must be documented inline in the relevant service layer
