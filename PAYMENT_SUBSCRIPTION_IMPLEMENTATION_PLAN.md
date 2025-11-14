# Payment & Subscription System Implementation Plan

## Overview
Enhancing the Code Fix Platform with two payment options:
1. **Per-Project Proposals** - Pay-as-you-go for individual projects
2. **Subscription Packages** - Monthly recurring plans with included hours

## Database Schema Changes ✅ COMPLETED

### 1. Users Table - Added Payment Method Storage
```typescript
stripePaymentMethodId: text("stripe_payment_method_id") // Saved card for pre-authorization
```

### 2. Proposals Table - Enhanced Pricing Structure
```typescript
pricingType: text("pricing_type").notNull() // "hourly" or "flat_fee"
hourlyRate: integer("hourly_rate") // in cents per hour (NEW)
estimatedHours: integer("estimated_hours") // existing
fixFee: integer("fix_fee") // in cents (existing)
```

### 3. Subscription Packages Table - NEW
```typescript
export const subscriptionPackages = pgTable("subscription_packages", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Starter", "Pro", "Enterprise"
  description: text("description").notNull(), // Services included
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  hoursIncluded: integer("hours_included").notNull(), // hours per month
  stripePriceId: text("stripe_price_id"), // Stripe recurring price ID
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

### 4. Subscriptions Table - Enhanced
```typescript
packageId: varchar("package_id") // Links to subscription package
hoursUsed: integer("hours_used").default(0) // Tracks usage in current period
status: text("status") // active, canceled, past_due, trialing
currentPeriodStart: timestamp
currentPeriodEnd: timestamp
```

## Implementation Phases

### Phase 1: Stripe Integration Setup (PENDING STRIPE KEYS)
**Requirements:**
- STRIPE_SECRET_KEY (backend)
- VITE_STRIPE_PUBLIC_KEY (frontend)

**Components:**
1. Stripe instance initialization in `server/routes.ts`
2. SetupIntent API for payment method collection
3. Subscription creation with Stripe Checkout

### Phase 2: Per-Project Proposal Enhancement

#### Backend APIs
1. **Update Proposal Creation**
   - Validate pricingType ("hourly" or "flat_fee")
   - For hourly: require hourlyRate and estimatedHours
   - For flat_fee: require fixFee
   
2. **Payment Method Setup**
   ```typescript
   POST /api/setup-payment-method
   // Creates Stripe SetupIntent
   // Returns clientSecret for frontend
   ```

3. **Proposal Acceptance with Payment**
   ```typescript
   POST /api/proposals/:id/accept-with-payment
   // 1. Accept proposal
   // 2. Attach payment method to customer
   // 3. Save stripePaymentMethodId to user
   // 4. Update project status to "accepted"
   ```

#### Frontend Components
1. **Enhanced Proposal Display** (`client/src/pages/project-detail.tsx`)
   - Show pricing type clearly (Hourly Rate vs Flat Fee)
   - For hourly: Display rate per hour + estimated hours
   - For flat fee: Display total amount

2. **Payment Setup Modal** (NEW: `client/src/components/payment-setup-modal.tsx`)
   - Stripe Elements integration
   - Card input form
   - Pre-authorization flow
   - "Accept Proposal & Add Payment Method" button

### Phase 3: Subscription Packages System

#### Backend APIs
1. **Master Admin Package Management**
   ```typescript
   POST /api/admin/subscription-packages // Create package
   GET /api/admin/subscription-packages // List all packages
   PUT /api/admin/subscription-packages/:id // Update package
   DELETE /api/admin/subscription-packages/:id // Deactivate package
   ```

2. **Client Subscription Management**
   ```typescript
   GET /api/subscription-packages // List active packages
   POST /api/subscribe // Create Stripe subscription
   POST /api/cancel-subscription // Cancel subscription
   GET /api/subscription/usage // Get current usage stats
   ```

3. **Stripe Webhook Handler**
   ```typescript
   POST /api/stripe/webhook
   // Handle subscription events:
   // - invoice.payment_succeeded
   // - customer.subscription.updated
   // - customer.subscription.deleted
   ```

#### Frontend Pages

1. **Master Admin: Package Management** (NEW: `/admin/manage-packages`)
   - Create/edit subscription tiers
   - Set pricing, hours included, description
   - Toggle active/inactive status
   - View subscriber counts per package

2. **Client: Subscription Selection** (NEW: `/subscribe`)
   - Display available packages as cards
   - Compare features side-by-side
   - Stripe Checkout integration
   - Payment method collection

3. **Client Dashboard Enhancement**
   - Show active subscription status
   - Display hours used vs hours remaining
   - Monthly billing period countdown
   - Upgrade/downgrade options

### Phase 4: Hours Tracking Integration

#### Time Entry Updates
When admins log time on projects:
1. Check if client has active subscription
2. If subscribed: Deduct from hoursUsed
3. If over limit or no subscription: Track for billing
4. Display warnings when approaching hour limits

#### Billing Logic
- **Subscription clients**: Hours within package = included
- **Subscription overage**: Charge at predetermined rate
- **Non-subscription**: Charge based on proposal terms

## User Flows

### Flow 1: Per-Project with Flat Fee
1. Client submits project
2. Admin assigns and sends proposal (Flat Fee: $500)
3. Client views proposal, clicks "Accept & Add Payment"
4. Payment modal opens with Stripe card form
5. Client enters card details (pre-authorized, not charged)
6. System saves payment method, marks proposal accepted
7. Admin completes work, creates payment request
8. Client approves, card is charged $500

### Flow 2: Per-Project with Hourly Rate
1. Admin sends proposal (Hourly: $100/hr, Est. 5 hours)
2. Client accepts, adds payment method (pre-authorized)
3. Admin logs 6.5 hours of actual work
4. System calculates: 6.5 × $100 = $650
5. Payment request sent to client
6. Client approves, card charged $650

### Flow 3: Subscription Signup
1. Client browses packages on /subscribe
2. Selects "Pro Plan" ($299/mo, 10 hours included)
3. Enters payment details in Stripe Checkout
4. Subscription activates immediately
5. Dashboard shows "10 hours remaining this month"
6. Admin logs 3 hours on project → "7 hours remaining"

### Flow 4: Subscription with Overage
1. Client has Pro Plan (10 hours/month)
2. Admin logs 12 total hours in billing period
3. System alerts: "2 hours over limit"
4. Additional hours billed at overage rate
5. Next month: hours reset to 10

## Security Considerations

1. **Payment Method Storage**
   - Never store raw card numbers
   - Only store Stripe payment method IDs
   - Use Stripe's PCI-compliant tokenization

2. **Pre-Authorization**
   - SetupIntent confirms card validity
   - $0 authorization hold
   - Actual charges only on explicit approval

3. **Webhook Verification**
   - Verify Stripe webhook signatures
   - Prevent replay attacks
   - Log all payment events

## Testing Requirements

### Test Scenarios
1. Proposal acceptance with payment method
2. Subscription signup and activation
3. Hours tracking and overage calculation
4. Subscription cancellation
5. Payment method updates
6. Webhook event handling

### Test Cards (Stripe Test Mode)
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0027 6000 3184

## Next Steps (Pending Stripe Keys)

Once you provide `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`, I will:

1. ✅ Complete backend Stripe integration
2. ✅ Create payment setup components
3. ✅ Build subscription package management UI
4. ✅ Implement hours tracking logic
5. ✅ Add webhook handlers
6. ✅ Test complete payment flows
7. ✅ Document usage for admins and clients

## Current Status

✅ Database schema updated
✅ TypeScript types generated
✅ Zod validation schemas created
⏸️ Awaiting Stripe API keys to continue implementation

---

**Note:** This is a comprehensive payment system that supports both pay-per-project and recurring subscription models, giving you flexibility in how you charge clients while maintaining the professional service quality your platform promises.
