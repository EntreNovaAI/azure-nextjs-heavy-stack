# Profile Feature Documentation

## Overview

The profile feature allows authenticated users to view their account information and manage their subscriptions. Users can view their current plan, subscription details, and unsubscribe from paid plans if needed.

## Features

### User Information Display

- **Personal Details**: Name, email, profile image, member since date
- **Subscription Status**: Current plan (Free, Basic, Premium)
- **Stripe Integration**: Customer ID display for paid users
- **Account Timeline**: Creation and last update dates

### Subscription Management

- **Plan Status**: Clear indication of current subscription level
- **Unsubscribe Functionality**: Cancel paid subscriptions
- **Graceful Downgrade**: Subscription continues until end of billing period
- **Free Plan Users**: Upgrade links to products page

### Security Features

- **Authentication Required**: Only authenticated users can access profile
- **User Verification**: Stripe customer ID must match authenticated user
- **Session Validation**: Server-side session verification for all operations

## File Structure

```

app/
├── profile/
│   ├── page.tsx                 # Main profile page (Server Component)
│   ├── profile-client.tsx       # Client component for UI interactions
│   └── __tests__/
│       └── page.test.tsx        # Profile page tests
└── api/
    └── stripe/
        └── unsubscribe/
            ├── route.ts         # Unsubscribe API endpoint
            └── __tests__/
                └── route.test.ts # Unsubscribe API tests
```

## API Endpoints

### `/api/stripe/unsubscribe` (POST)

Cancels user's active Stripe subscriptions and downgrades to free plan.

**Request Body:**

```json
{
  "stripeCustomerId": "cus_xxxxxxxxxxxxxx"
}
```

**Response (Success):**

```json
{
  "message": "Successfully unsubscribed",
  "cancelledSubscriptions": ["sub_xxxxxxxxxxxxxx"],
  "newAccessLevel": "free",
  "note": "Your subscription will end at the end of the current billing period"
}
```

**Security Checks:**

1. User authentication validation
2. Stripe customer ID format validation  
3. Customer ID ownership verification
4. Current subscription status check

## User Flow

### Accessing Profile

1. User must be authenticated (redirects to home if not)
2. Server fetches user data from database
3. Creates new user record if doesn't exist (with free plan)
4. Renders profile with current information

### Unsubscribing Process

1. User clicks "Unsubscribe" button (only visible for paid users)
2. Confirmation dialog appears
3. API call to `/api/stripe/unsubscribe` with customer ID
4. Server validates user and cancels Stripe subscriptions
5. User updated to free plan in database
6. Success message displayed with billing period note
7. Page refreshes to show updated status

## Integration Points

### Database Schema

Uses existing User model with fields:
- `accessLevel`: 'free' | 'basic' | 'premium'
- `stripeCustomerId`: Links to Stripe customer
- `createdAt`/`updatedAt`: Timeline tracking

### Stripe Integration  

- Lists active subscriptions for customer
- Cancels subscriptions at period end (not immediately)
- Webhook handles final downgrade when subscription actually ends

### NextAuth Integration

- Uses server-side session validation
- Leverages existing authentication flow
- Integrates with user session data

## Styling

The profile page uses inline styles with:

- **Responsive Design**: Mobile-friendly layout
- **Clean Interface**: Card-based sections
- **Status Indicators**: Color-coded plan levels
- **Action Buttons**: Clear call-to-action styling
- **Feedback Messages**: Success/error states

## Testing

### Unit Tests

- **Profile Page**: Authentication, user creation, data display
- **Unsubscribe API**: Security validation, Stripe integration, error handling
- **Component Rendering**: UI elements and user interactions

### Test Coverage

- Authentication scenarios (logged in/out)
- User creation for new users
- Subscription cancellation flows
- Error handling and edge cases
- Security validation

## Navigation Integration

Profile link added to main navigation:

- Only visible for authenticated users
- Located next to Products link
- Clean integration with existing navigation style

## Future Enhancements

Potential improvements:

- **Plan Upgrade**: Direct upgrade from profile page
- **Billing History**: Show past payments and invoices
- **Account Settings**: Edit name, email preferences
- **Subscription Details**: Show next billing date, amount
- **Usage Statistics**: Feature usage tracking
- **Export Data**: Download account information
