# Identity Reconciliation System

This service helps identify and track customer identities across multiple purchases by linking contact information (email and phone numbers).

## Problem Statement

FluxKart.com needs to track customer identities across multiple purchases where customers might use different email addresses and phone numbers. The system needs to:

1. Link different contact information to the same customer
2. Maintain primary and secondary contact relationships
3. Provide consolidated contact information through an API

## Approach

1. **Data Model**:
   - Use a Contact table to store all contact information
   - Track relationships between contacts using linkedId and linkPrecedence
   - Maintain creation and update timestamps

2. **Business Logic**:
   - When new contact info arrives:
     - Check for existing contacts with matching email or phone
     - Create new primary contact if no matches exist
     - Create secondary contact if partial match exists
     - Link all related contacts to the oldest primary contact

3. **API Design**:
   - POST /identify endpoint
   - Accepts email and/or phone number
   - Returns consolidated contact information

## API Documentation

### POST /identify

Request body:
```json
{
  "email": string | null,
  "phoneNumber": string | null
}
```

Response:
```json
{
  "contact": {
    "primaryContactId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```
   MYSQL_DATABASE_URL=your_mysql_url
   PORT=3000
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

## Database Schema

```sql
CREATE TABLE Contact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phoneNumber VARCHAR(255),
  email VARCHAR(255),
  linkedId INT,
  linkPrecedence ENUM('primary', 'secondary'),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);
```