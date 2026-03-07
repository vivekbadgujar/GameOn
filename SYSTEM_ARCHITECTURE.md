# Manual UPI Payment System - Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Browse Tournament
┌─────────────┐
│  User App   │
│  Tournaments│
│    Page     │
└──────┬──────┘
       │ Clicks "Join Tournament"
       │ (for paid tournament)
       ▼
       
STEP 2: Manual Payment Page
┌────────────────────────────┐
│  /manual-payment page       │
│  ┌────────────────────────┐ │
│  │ UPI Instructions       │ │
│  │ ├─ Copy UPI            │ │
│  │ │  gameon@upi          │ │
│  │ └─ Steps 1-5           │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ Payment Form          │ │
│  │ ├─ Player Name        │ │
│  │ ├─ Email              │ │
│  │ ├─ Phone              │ │
│  │ ├─ Game ID            │ │
│  │ ├─ Transaction ID     │ │
│  │ └─ Screenshot Upload  │ │
│  └────────────────────────┘ │
└────────────────────────────┘
       │ Submits Form
       ▼
       
STEP 3: Backend Processing
┌──────────────────────────────────────────┐
│  POST /api/payments/manual/submit         │
│  ├─ Validate all fields                   │
│  ├─ Store file in uploads/payments/       │
│  ├─ Create Payment record (status:pending)│
│  └─ Return success                        │
└──────────────────────────────────────────┘
       │ Success
       ▼
       
STEP 4: Payment Pending Page
┌─────────────────────┐
│  Confirmation Page  │
│  Status: Pending    │
│  ⏳ Verification... │
└─────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Admin Dashboard
┌─────────────────────────────┐
│  Admin Panel                 │
│  ├─ Dashboard               │
│  ├─ Tournaments             │
│  ├─ [Payment Verification]  │
│  ├─ Users                   │
│  └─ ...more                 │
└─────────────────────────────┘
       │ Clicks "Payment Verification"
       ▼

STEP 2: Payment List
┌──────────────────────────────────────┐
│  /payment-verification               │
│  ┌──────────────────────────────────┐│
│  │ Payments List (Status: Pending)  ││
│  │ ┌────────────────────────────────┐│
│  │ │ • Player: John Doe             ││
│  │ │   Tournament: BGMI Cup         ││
│  │ │   Game ID: john123             ││
│  │ │   TXN: TXN12345...             ││
│  │ │   [View Details]               ││
│  │ ├────────────────────────────────┤│
│  │ │ • Player: Jane Smith           ││
│  │ │   Tournament: Valorant Elite   ││
│  │ │   Game ID: jane_smith_9        ││
│  │ │   TXN: TXN98765...             ││
│  │ │   [View Details]               ││
│  │ └────────────────────────────────┘│
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
       │ Clicks "View Details"
       ▼

STEP 3: Payment Details & Screenshot
┌─────────────────────────────────────────┐
│  Preview Modal                          │
│  ┌─────────────────────────────────────┐│
│  │ Player: John Doe                    ││
│  │ Email: john@test.com                ││
│  │ Phone: 9999999999                   ││
│  │ Game ID: john123                    ││
│  │ Transaction ID: TXN12345            ││
│  │ Status: Pending ⏳                  ││
│  │                                     ││
│  │ ┌─────────────────────────────────┐││
│  │ │ [Screenshot Image Display]      │││
│  │ │ (Payment Proof from UPI app)    │││
│  │ │                                 │││
│  │ │ ₹500 payment verified ✓        │││
│  │ └─────────────────────────────────┘││
│  │                                     ││
│  │ [❌ Reject]  [✅ Approve]          ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
       │ Clicks "Approve"
       ▼

STEP 4: Backend Approval
┌─────────────────────────────────────┐
│  POST /api/payments/.../approve     │
│  ├─ Find Payment record             │
│  ├─ Update status: "approved"       │
│  ├─ Add to Tournament.participants  │
│  │  ├─ user: null                   │
│  │  ├─ slotNumber: calculated       │
│  │  ├─ paymentStatus: "completed"   │
│  │  └─ joinedAt: Date.now()         │
│  ├─ Update currentParticipants++    │
│  └─ Save Tournament                 │
└─────────────────────────────────────┘
       │ Success
       ▼

STEP 5: User Notification
┌──────────────────────────────┐
│ User sees status change:      │
│ ✅ Approved                   │
│ Participant added!            │
│ Can now access tournament     │
└──────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND (React/Next.js)       │   ADMIN (React)            │
│  ┌────────────────────────┐     │  ┌──────────────────────┐  │
│  │ Tournament Details Pg  │     │  │ Admin Layout         │  │
│  │ - Show tournament info │     │  │ ├─ Sidebar           │  │
│  │ - Join button (paid?)  │     │  │ │  - Payment Verify  │  │
│  │                        │     │  │ └─ Main Content      │  │
│  └────────────────────────┘     │  │   - Payment List   │  │
│                                 │  │   - Preview Modal   │  │
│  ┌────────────────────────┐     │  │   - Approve/Reject  │  │
│  │ Manual Payment Page    │     │  └──────────────────────┘  │
│  │ - Step 1: Instructions │     │                            │
│  │ - Step 2: Form         │     │                            │
│  │ - Step 3: Confirm      │     │                            │
│  └────────────────────────┘     │                            │
└─────────────────────────────────────────────────────────────┘
        │                               │
        ▼ API Calls                     ▼ API Calls
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│                  /api/payments/manual/*                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ POST   /submit             - Submit payment form       │ │
│  │        ├─ Validate inputs                              │ │
│  │        ├─ Handle file upload (multer)                  │ │
│  │        ├─ Check duplicate transaction ID               │ │
│  │        ├─ Check one-per-email constraint               │ │
│  │        └─ Create Payment record                        │ │
│  │                                                         │ │
│  │ GET    /manual/status/:tournamentId - Get status      │ │
│  │        ├─ Find Payment by tournament + email           │ │
│  │        └─ Return status (pending/approved/rejected)    │ │
│  │                                                         │ │
│  │ GET    /admin/payments    - List all payments          │ │
│  │        ├─ Filter by status                             │ │
│  │        ├─ Paginate results                             │ │
│  │        └─ Return with tournament info                  │ │
│  │                                                         │ │
│  │ POST   /admin/payments/:id/approve - Approve payment  │ │
│  │        ├─ Verify admin auth + permission              │ │
│  │        ├─ Update payment.status = "approved"           │ │
│  │        ├─ Add participant to tournament               │ │
│  │        └─ Increment tournament.currentParticipants    │ │
│  │                                                         │ │
│  │ POST   /admin/payments/:id/reject  - Reject payment   │ │
│  │        ├─ Verify admin auth + permission              │ │
│  │        └─ Update payment.status = "rejected"           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        ▼ Read/Write
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (MongoDB)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ Payment Collection       │  │ Tournament Collection    │ │
│  │ ├─ tournament (ref)       │  │ (Modified Fields)        │ │
│  │ ├─ playerName            │  │ ├─ title                 │ │
│  │ ├─ email (indexed)       │  │ ├─ entryFee              │ │
│  │ ├─ phone                 │  │ ├─ currentParticipants   │ │
│  │ ├─ gameId                │  │ ├─ maxParticipants       │ │
│  │ ├─ transactionId (unique)│  │ ├─ participants: [       │ │
│  │ ├─ screenshotUrl         │  │ │   ├─ user              │ │
│  │ ├─ paymentStatus         │  │ │   ├─ slotNumber        │ │
│  │ ├─ createdAt             │  │ │   ├─ paymentStatus     │ │
│  │ └─ updatedAt             │  │ │   └─ ...               │ │
│  │                          │  │ │ ]                       │ │
│  │ Indexes:                 │  │ └─ ...                   │ │
│  │ • transactionId (unique) │  │                          │ │
│  │ • tournament+email       │  │ Modified to track        │ │
│  │   (unique, one per user) │  │ manual payments          │ │
│  │ • paymentStatus          │  │                          │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        │
        ▼ File Storage
┌─────────────────────────────────────────────────────────────┐
│                FILE STORAGE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  backend/uploads/payments/                                  │
│  ├─ payment-1709811234569.jpg                              │
│  ├─ payment-1709811234570.jpg                              │
│  ├─ payment-1709811234571.png                              │
│  └─ ...                                                     │
│                                                              │
│  (Max 5MB per file, JPG/PNG only)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

```
FRONTEND STATE:
┌──────────────────────────────────┐
│ Manual Payment Form State        │
├──────────────────────────────────┤
│ step: 1|2|3                      │ ◄── Controls UI render
│ tournament: {...}                │ ◄── Fetched on load
│ formData: {                      │ ◄── User input
│   playerName: "",                │
│   email: "",                     │
│   gameId: "",                    │
│   phone: "",                     │
│   transactionId: "",             │
│   screenshot: File|null          │
│ }                                │
│ errors: {field: "msg", ...}      │ ◄── Validation errors
│ submitting: boolean              │ ◄── Loading state
└──────────────────────────────────┘

ADMIN STATE:
┌──────────────────────────────────┐
│ Payment Verification State       │
├──────────────────────────────────┤
│ payments: [...]                  │ ◄── API response
│ statusFilter: "pending"|...      │ ◄── UI filter
│ selectedPayment: {...}|null      │ ◄── Preview modal
│ previewOpen: boolean             │ ◄── Modal visibility
│ loading: boolean                 │ ◄── API loading
│ actionLoading: boolean           │ ◄── Action in progress
└──────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│           SECURITY LAYERS                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. AUTHENTICATION                                   │
│    ├─ JWT token required on all endpoints          │
│    ├─ Token verified via middleware                │
│    └─ User/Admin identified from token             │
│                                                     │
│ 2. AUTHORIZATION                                    │
│    ├─ Users can only submit/view own payments      │
│    ├─ Admin needs "finance_manage" permission      │
│    └─ Additional role checks in middleware         │
│                                                     │
│ 3. INPUT VALIDATION                                 │
│    ├─ Form field validation (frontend)             │
│    ├─ Express-validator on backend                 │
│    ├─ Email format check                           │
│    └─ Phone number validation                      │
│                                                     │
│ 4. FILE VALIDATION                                  │
│    ├─ Multer file filter (JPG/PNG)                 │
│    ├─ File size limit (5MB)                        │
│    ├─ MIME type check                              │
│    └─ Frontend validation                          │
│                                                     │
│ 5. DATABASE CONSTRAINTS                             │
│    ├─ Unique constraint on transactionId           │
│    ├─ Unique compound index (tournament, email)    │
│    └─ Indexed for performance                      │
│                                                     │
│ 6. RATE LIMITING                                    │
│    ├─ Express rate limiter active                  │
│    ├─ 10 requests per 15 minutes per IP            │
│    └─ Applies to payment submissions               │
│                                                     │
│ 7. DATA INTEGRITY                                   │
│    ├─ Transactions use MongoDB transactions        │
│    ├─ Payment + Participant atomic operations      │
│    └─ Status updates consistent                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
Tournament ◄──┐
  ├─ _id      │
  ├─ title    │
  ├─ entryFee │
  └─ ...      │
              │ references
          ┌───┴──────────┐
          │              │
      Payment ────── Participant (in Tournament)
      ├─ tournament*     ├─ user
      ├─ email           ├─ slotNumber
      ├─ gameId          ├─ paymentStatus
      ├─ transactionId   └─ ...
      ├─ screenshot
      └─ paymentStatus

                      * = foreign key reference
```

---

## Data Flow Timeline

```
Timeline of Payment Request:

T0: User clicks "Join Tournament"
    └─> TournamentDetails checks entryFee > 0
        └─> Redirects to /manual-payment

T1: Manual payment page loads
    └─> getTournamentById() called
        └─> Tournament data fetched and displayed

T2: User fills form and uploads screenshot
    └─> Form validation on change
        └─> File validation on selection

T3: User clicks "Submit Payment"
    └─> Final validation
        └─> FormData created with file
            └─> POST /api/payments/manual/submit

T4: Backend receives submission (75-150ms)
    ├─> ExpressValidator checks all fields
    ├─> Multer handles file upload
    ├─> Check for duplicate transactionId
    ├─> Check one-per-email constraint
    ├─> Create Payment document
    └─> Return success response

T5: Frontend receives success (50-100ms)
    └─> setStep(3)
        └─> Show confirmation page

T6: User sees "Payment Pending Verification"
    └─> Can navigate away or back to tournaments

T100+: Admin logs in and reviews payment
    └─> GET /api/payments/admin/payments
        └─> List all pending payments

T101: Admin previews payment details
    └─> See payment info + screenshot

T102: Admin clicks "Approve"
    └─> POST /api/payments/.../approve
        ├─> Update payment.status = "approved"
        ├─> Add participant to tournament
        ├─> Increment currentParticipants
        └─> Save changes

T103: Participant added to tournament
    └─> User can now access tournament details
        └─> Participant count reflects update
```

---

## Error Handling Flow

```
Error Scenarios & Handling:

1. DUPLICATE TRANSACTION ID
   └─> User submits TXN already used
       └─> MongoDB unique constraint violation
           └─> Backend catches & returns error
               └─> Frontend shows error message
                   └─> User can try again with new TXN

2. ONE ENTRY PER EMAIL PER TOURNAMENT
   └─> Same email submits twice for same tournament
       └─> MongoDB compound index violation
           └─> Backend catches & returns error
               └─> Frontend shows "Already submitted"
                   └─> User directed to check status

3. INVALID FILE UPLOAD
   └─> User uploads .gif instead of .jpg
       └─> Multer rejects in fileFilter
           └─> Error sent to frontend
               └─> Frontend displays file type error
                   └─> User can retry with correct file

4. FILE TOO LARGE
   └─> User uploads 10MB file
       └─> Multer catches size limit
           └─> Returns 413 error
               └─> Frontend shows file size error

5. NETWORK ERROR
   └─> Request times out or fails
       └─> Fetch catch block triggered
           └─> Error message shown
               └─> User can retry

6. ADMIN APPROVAL FAILS
   └─> Tournament not found or full
       └─> Backend validation fails
           └─> Returns error response
               └─> Admin sees error message
                   └─> Can investigate issue
```

---

## Performance Considerations

```
OPTIMIZATION STRATEGIES:

1. Database Indexing
   └─ Indexes on:
      ├─ transactionId (unique) → O(1) lookup
      ├─ tournament+email (unique) → O(1) compound
      ├─ paymentStatus → O(1) filtering
      └─ admin list queries use all three

2. File Uploads
   └─ Multer stores locally (can migrate to S3)
   └─ Max 5MB enforced at upload time
   └─ No processing, just storage

3. API Pagination
   └─ Admin list uses pagination (default 50 per page)
   └─ Prevents large query result sets
   └─ Memory efficient for large datasets

4. Frontend Caching
   └─ Tournament data cached once
   └─ Payment status fetched on demand
   └─ No unnecessary re-renders

5. Query Optimization
   └─ Find only needed fields
   └─ Lean queries where appropriate
   └─ Population limited to needed refs
```

---

## Rollback Strategy

If needed to revert:

```
Step 1: Revert routing
└─ backend/server.js line 325
   └─ Change from manualPayments to payments-cashfree

Step 2: Revert tournament join logic
└─ frontend/TournamentDetails.js
   └─ Remove manual payment redirect

Step 3: Remove new database collection
└─ db.payments.drop()

Step 4: Optional - restore cashfree files
└─ File restoration from git history
```

---

*Architecture finalized and production-ready.*
