# Notification Service - Fincz-Track

## Overview
The Notification Service handles email notifications and scheduled alerts for the Fincz-Track platform. It provides functionality for sending custom notifications, tax filing reminders, and portfolio performance alerts.

## Features
- **Email Notifications**: Send custom email notifications to users
- **Tax Reminders**: Automated quarterly tax filing reminders
- **Portfolio Alerts**: Real-time alerts for significant portfolio changes
- **Scheduled Jobs**: Background tasks for automated notifications
- **Notification History**: Track all sent notifications per user

## Technology Stack
- **Framework**: Spring Boot 4.0.5
- **Language**: Java 17
- **Database**: H2 (dev) / PostgreSQL (prod)
- **Email**: Spring Mail with SMTP
- **Scheduling**: Quartz Scheduler
- **Security**: JWT Authentication

## API Endpoints

### Health Check
```
GET /api/notifications/test
```
Returns service status (no auth required).

### Send Notification
```
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "toEmail": "user@example.com",
  "subject": "Notification Subject",
  "message": "Notification message content"
}
```

### Get User Notifications
```
GET /api/notifications
Authorization: Bearer <token>
```
Returns notification history for authenticated user.

### Trigger Tax Reminders
```
POST /api/notifications/tax-reminder
Authorization: Bearer <token>
```
Manually triggers tax reminder check.

### Trigger Portfolio Alerts
```
POST /api/notifications/portfolio-alert
Authorization: Bearer <token>
```
Manually triggers portfolio alert check.

## Configuration

### Email Settings
Configure email properties in `application.yaml`:
```yaml
fincz:
  email:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    from: noreply@fincz-track.com
    auth: true
    starttls: true
```

### Database
Default H2 configuration:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:notificationdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
```

## Scheduled Jobs

### Tax Reminder Job
- **Schedule**: Daily at 9:00 AM
- **Purpose**: Send tax filing reminders to users
- **Trigger**: `POST /api/notifications/tax-reminder`

### Portfolio Alert Job
- **Schedule**: Every hour
- **Purpose**: Check for significant portfolio changes
- **Trigger**: `POST /api/notifications/portfolio-alert`

## Running the Service

### Individual Service
```bash
./run-services.sh notification
```

### All Services
```bash
./run-services.sh all
```

### Environment Variables
```bash
export JWT_SECRET="your-secret-key"
export DB_URL="jdbc:postgresql://localhost:5432/notificationdb"
export DB_USER="your-db-user"
export DB_PASS="your-db-password"
```

## Testing

### API Tests
Run tests using the provided `api-tests.http` file in VS Code REST Client or similar tools.

### Manual Testing
1. Start the service
2. Use health check endpoint: `GET /api/notifications/test`
3. Send a test notification via API
4. Check notification history

## Database Schema

### Notification Entity
- `id`: Primary key
- `userEmail`: Recipient email
- `subject`: Email subject
- `message`: Email content
- `sentAt`: Timestamp when sent
- `status`: Delivery status

## Security
- JWT authentication required for all endpoints except health check
- Shared JWT secret with other services
- Email credentials should be stored securely in production

## Monitoring
- Application logs available in `logs/notification-service.log`
- Health check endpoint for service monitoring
- Database connection monitoring via Spring Actuator

## Development Notes
- Service runs on port 8085
- Uses H2 in-memory database for development
- Email functionality requires valid SMTP configuration
- Scheduled jobs run automatically when service starts