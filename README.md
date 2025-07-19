# GameOn: AI-Powered BGMI Tournament Platform

Welcome to the GameOn project! This document serves as the master plan for building an AI-powered BGMI tournament app and website for Indian college gamers and casual players.

---

## 🎨 UI/UX Design

The platform's design will be clean, modern, and imbued with a gaming aesthetic to resonate with the target audience.

-   **Theme**: A clean, dark theme will be the foundation, creating an immersive experience. Key elements will be highlighted with neon green and purple to create a vibrant, "gaming vibe."
-   **Tournament Listings**: Tournaments will be displayed in a card-style layout. Each card will show essential information at a glance: Tournament Name, Date/Time, Entry Fee, Prize Pool, and Team Type (Solo, Duo, Squad).
-   **Calls-to-Action (CTAs)**: Buttons for critical actions like "Join Match" or "Register" will use a high-contrast neon green or purple to stand out and guide user interaction.
-   **AI Verification Badge**: To build trust, screenshots verified by our AI will feature a distinct "AI Verified" badge.
-   **Gamification**: A simple XP system will be implemented. Players earn XP for participating and winning matches. Accumulating XP unlocks badges (e.g., "Weekly Winner," "Headshot Master") that are displayed on their profiles.

---

## 📊 Database Schema (Firebase/Supabase)

Here is a foundational schema. We'll use a NoSQL approach with Firebase's Firestore for flexibility and real-time capabilities.

-   **users**:
    -   `uid` (Primary Key)
    -   `name`
    -   `mobile` (for OTP auth)
    -   `gameID`
    -   `walletBalance`
    -   `xpPoints`
    -   `unlockedBadges` (Array)
    -   `matchHistory` (Array of `tournamentID`)
    -   `referralCode`
    -   `createdAt`
-   **tournaments**:
    -   `tournamentID` (Primary Key)
    -   `title`
    -   `map` (e.g., Erangel, Sanhok)
    -   `teamType` (Solo, Duo, Squad)
    -   `prizePool`
    -   `entryFee`
    -   `status` (Upcoming, Active, Completed, Canceled)
    -   `scheduledAt`
    -   `roomID` (Encrypted)
    -   `roomPassword` (Encrypted)
    -   `participants` (Array of `userID`)
    -   `winner` (userID or teamID)
-   **participants**:
    -   `participationID` (Primary Key)
    -   `userID`
    -   `tournamentID`
    -   `finalRank`
    -   `kills`
    -   `screenshotURL`
    -   `isVerified` (Boolean, set by AI)
    -   `reviewStatus` (Pending, Approved, Flagged)
-   **transactions**:
    -   `transactionID` (Primary Key)
    -   `userID`
    -   `amount`
    -   `type` (EntryFee, PrizeWin, WalletTopUp)
    -   `razorpayPaymentID`
    -   `timestamp`
-   **adminUsers**:
    -   `adminID` (Primary Key)
    -   `email`
    -   `hashedPassword`
-   **notifications**:
    -   `notificationID` (Primary Key)
    -   `userID` (or `broadcast: true`)
    -   `message`
    -   `isRead`
    -   `createdAt`
-   **aiFlags**:
    -   `flagID` (Primary Key)
    -   `userID`
    -   `tournamentID`
    -   `reason` (e.g., "ScreenshotMismatch", "IPConflict", "FakeUpload")
    -   `details` (Object with AI-detected data)
    -   `status` (PendingReview, Resolved)

---

## ⚙️ Backend APIs (Node.js + Express)

API endpoints will be structured by resource. All routes will be prefixed with `/api`.

-   **Auth**:
    -   `POST /auth/send-otp`
    -   `POST /auth/verify-otp`
    -   `POST /admin/login`
-   **Users**:
    -   `GET /users/profile` (Get own profile)
    -   `PUT /users/profile` (Update profile/gameID)
    -   `GET /users/wallet`
    -   `GET /users/leaderboard`
-   **Tournaments**:
    -   `GET /tournaments` (List all)
    -   `GET /tournaments/:id` (Get details)
    -   `POST /tournaments/:id/join` (Join a match)
    -   `POST /tournaments/:id/upload-screenshot`
-   **Admin**:
    -   `GET /admin/tournaments`
    -   `POST /admin/tournaments` (Create)
    -   `PUT /admin/tournaments/:id` (Edit)
    -   `DELETE /admin/tournaments/:id`
    -   `POST /admin/tournaments/:id/set-room` (Set Room ID/Pass)
    -   `POST /admin/rewards/distribute`
    -   `GET /admin/flags` (See AI-flagged entries)
    -   `POST /admin/users/:id/ban`

---

## 🛒 Payment Integration (Razorpay)

-   **Frontend**: Integrate Razorpay's Checkout SDK. On "Join Match," call our backend to create a Razorpay order. The `order_id` is passed to the frontend SDK, which opens the payment modal.
-   **Backend**:
    1.  Create an API endpoint `POST /payments/create-order` that takes `amount` and `currency`.
    2.  It uses the Razorpay Node.js SDK to create an order and returns the `order_id` to the frontend.
    3.  Create a webhook endpoint `POST /payments/webhook` to listen for Razorpay events (e.g., `payment.captured`).
    4.  When a payment is successful, the webhook handler will securely verify the signature, update the user's wallet, and add the user to the tournament participants list.

---

## 🧠 AI Modules

AI is our core differentiator. We'll use a serverless function (Firebase Functions) to handle these tasks asynchronously.

1.  **Screenshot Verifier**:
    -   **Trigger**: A new file is uploaded to the "screenshots" bucket in Firebase Storage.
    -   **Process**:
        1.  The Firebase Function executes.
        2.  It sends the image URL to **Google Vision API**'s `TEXT_DETECTION` feature.
        3.  The API returns the recognized text.
        4.  Our code parses this text to find keywords like "Rank," "Kills," and player names.
        5.  It compares the extracted data with the player's claim. If `rank: "#1"` but screenshot shows `"#10"`, it creates a record in the `aiFlags` table.
        6.  It also checks for image properties to detect potential tampering (e.g., unusual blurriness, conflicting metadata), flagging suspicious uploads.

2.  **Cheat Detection (IP Tracking)**:
    -   **Trigger**: On user login or when joining a tournament.
    -   **Process**:
        1.  Log the user's IP address with their `userID` for the session.
        2.  A backend process checks if multiple `userIDs` are participating in the *same tournament* from the *same IP address*.
        3.  If a conflict is found, an entry is created in the `aiFlags` table for manual admin review.

3.  **In-App Chat Moderator**:
    -   **Process**: All chat messages are passed through a simple API call to the **OpenAI API**.
    -   **Prompt**: The prompt will be engineered to classify text, e.g., `"Classify the following message as \'safe\' or \'abusive\': [message]"`.
    -   If "abusive" is returned, the message is blocked or flagged.

---

## 📁 Project Folder Structure

A clean, scalable folder structure is key.

```
GameOn-Platform/
├── .git/
├── .github/
│   └── workflows/      # CI/CD pipelines (e.g., deploy.yml)
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── api/        # Express routes (tournaments.js, users.js)
│   │   ├── config/     # Environment variables, Firebase/Supabase config
│   │   ├── controllers/ # Business logic (paymentController.js)
│   │   ├── models/     # Database interaction logic
│   │   ├── services/   # External API clients (razorpay.js, vision.js)
│   │   └── utils/      # Shared helper functions
│   ├── functions/      # Serverless functions (for AI tasks)
│   ├── package.json
│   └── .env.example
├── frontend/           # React.js (Web) + React Native (App)
│   ├── web/            # React.js web app
│   │   ├── public/
│   │   └── src/
│   │       ├── assets/
│   │       ├── components/ # Reusable UI components (TournamentCard.js)
│   │       ├── pages/    # Top-level pages (Dashboard.js, Profile.js)
│   │       ├── services/ # API call functions
│   │       └── App.js
│   ├── mobile/         # React Native app
│   │   └── ...         # Standard React Native structure
│   └── package.json
├── docs/               # Project documentation
│   └── api-spec.md     # OpenAPI/Swagger specs
└── README.md
```
