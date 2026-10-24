# API Endpoints

Endpoints supported by the Spring Boot backend:

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticate user and return JWT |
| `/api/auth/register` | POST | Register new user account |
| `/api/contacts` | GET, POST | List and create contacts |
| `/api/templates` | GET, POST | List and create email templates |
| `/api/campaigns` | GET, POST | List and create campaigns |
| `/api/campaigns/{id}/send` | POST | Send campaign |
| `/api/emails/retry` | POST | Retry failed deliveries |
| `/api/activities` | GET | Query open and click activities |
| `/api/analytics/overview` | GET | Deliverability metrics |
