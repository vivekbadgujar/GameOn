# Manual UPI Payment System Implementation

## Changes Made

### Backend Implementation

#### 1. **Payment Model** (`backend/models/Payment.js`)
- Tracks manual payment submissions with fields:
  - Tournament ref
  - Player name, email, phone
  - Game ID, UPI transaction ID
  - Screenshot URL
  - Payment status (pending/approved/rejected)
- Enforces unique transaction IDs
- Enforces one entry per email per tournament

#### 2. **Payment Routes** (`backend/routes/manualPayments.js`)
- **User endpoints:**
  - `POST /api/payments/manual/submit` - Submit payment form with screenshot
  - `GET /api/payments/manual/status/:tournamentId` - Check payment status
  
- **Admin endpoints:**
  - `GET /api/payments/admin/payments` - List payments (with status filter)
  - `POST /api/payments/admin/payments/:id/approve` - Approve and add participant
  - `POST /api/payments/admin/payments/:id/reject` - Reject payment

#### 3. **Middleware Updates** (`backend/middleware/tournamentParticipationValidation.js`)
- Adds check to prevent direct tournament joining for paid tournaments
- Redirects users to manual payment flow

#### 4. **Tournament Routes Fix** (`backend/routes/tournaments.js`)
- Added check: if `entryFee > 0`, reject direct join with message "Please complete manual payment and wait for admin approval"
- Free tournaments (entryFee = 0) still allow direct joining

#### 5. **Server Setup** (`backend/server.js`)
- Replaced `payments-cashfree` route with `manualPayments` route

### Frontend Implementation

#### 1. **Manual Payment Page** (`frontend/src/pages/manual-payment.js`)
- 3-step flow:
  1. **Instructions** - Show UPI details, tournament info, payment steps
  2. **Form** - Collect player info, game ID, transaction ID, screenshot
  3. **Confirmation** - Success message and status info
  
- Features:
  - Copy-to-clipboard for UPI ID
  - File validation (JPG/PNG, max 5MB)
  - Form validation before submission
  - Real-time field error handling

#### 2. **Tournament Details Update** (`frontend/src/pages/TournamentDetails.js`)
- Modified `handleJoinTournament()`:
  - If `tournament.entryFee > 0`: redirect to manual payment page
  - If `tournament.entryFee === 0`: allow free direct join

#### 3. **API Service** (`shared/services/unifiedApiService.js`)
- Added new methods:
  - `submitManualPayment(formData)` - Submit payment form
  - `getManualPaymentStatus(tournamentId)` - Check status

#### 4. **Cleanup**
- Deleted `frontend/src/services/cashfreeService.js` (Cashfree Gateway)
- Deleted `frontend/src/utils/cashfree.js` (Cashfree utils)

### Admin Panel Implementation

#### 1. **Payment Verification Component** (`admin-panel/src/components/PaymentVerification.js`)
- View all submissions with filtering by status
- Preview dialog showing all payment details + screenshot
- Approve button → adds participant + updates status
- Reject button → updates status only
- Real-time status updates

#### 2. **Navigation Updates**
- Added "Payment Verification" menu item to sidebar & admin layout
- Route: `/payment-verification`
- Icon: VerifiedUser

## Database Requirements

Ensure the following indexes exist in MongoDB:

```javascript
// Payment model indexes
db.payments.createIndex({ transactionId: 1 }, { unique: true })
db.payments.createIndex({ tournament: 1, email: 1 }, { unique: true })
db.payments.createIndex({ paymentStatus: 1 })
```

## Configuration

### Environment Variables (Optional)
No new environment variables required. The system uses:
- Existing API_BASE_URL
- Existing JWT authentication

### UPI Configuration
Currently hardcoded as `gameon@upi`. To change:
- Update `UPI_ID` constant in `frontend/src/pages/manual-payment.js`
- Update in admin panel component as needed

## Security Features

1. **Duplicate Prevention:**
   - Unique transaction ID validation
   - One entry per email per tournament
   - Server-side validation on submission

2. **File Validation:**
   - Only JPG/PNG allowed
   - Max 5MB file size
   - Multer validation on backend

3. **Authentication:**
   - User must be authenticated to submit
   - Admin must have `finance_manage` permission to verify
   - Both use JWT tokens

4. **Workflow Protection:**
   - Users cannot directly join paid tournaments
   - Admin approval required before participant is added
   - Payment status tracked separately from participation

## User Flow

1. User clicks "Join Tournament" on paid tournament
2. Redirected to manual payment page
3. Views UPI instructions and tournament details
4. Submits form with payment proof
5. Gets "pending verification" status
6. Admin reviews payment screenshot
7. Admin approves → participant added, slots updated
8. User sees approved status and can access tournament

## Admin Flow

1. Admin logs in to admin panel
2. Goes to "Payment Verification" section
3. Filters by "Pending" to see awaiting approvals
4. Clicks "View Details" to see full payment info + screenshot
5. Decides to Approve or Reject
6. Approve: Payment marked approved + participant added + participant count updated
7. Reject: Payment marked rejected (manual communication with user)

## Benefits

✅ No payment gateway integration needed
✅ Manual control over tournament entries
✅ Simple screenshot-based verification
✅ Can integrate with external payment services later
✅ User-friendly payment flow
✅ Admin has full visibility and control
✅ Prevents duplicate payments
✅ Enforces one entry per email per tournament

## Future Enhancements

Optional additions:
- Email notifications on payment approval/rejection
- Admin notes/comments on each payment
- Payment amount override for discounts
- Bulk approval/rejection
- Payment analytics dashboard
- Refund management system
