# Chatify

Chatify is a real-time, cross-platform messaging application designed with a robust backend and a modern mobile interface.

## 🚀 Technology Stack

### Backend (Server-Side)

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Storage:** Cloudinary (Media assets)
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt for password security.

### Mobile (Client-Side)

- **Framework:** React Native with Expo (SDK 54)
- **Navigation:** Expo Router (File-based navigation)
- **Language:** TypeScript
- **State Management:**
  - **Global State:** Zustand
  - **Server State:** TanStack React Query (Data caching & fetching)
- **Real-time:** Socket.io-client
- **UI/UX:** React Native `StyleSheet` for optimized, built-in styling with a premium dark theme.

---

## 🏗️ System Architecture

### 1. Backend Structure (`backend/src`)

The backend follows a modular architecture:

- **`models/`**: Defines the data schema for Users, Chats, and Messages.
- **`routes/`**: Handles API endpoints for Authentication, Users, Chats, and Messages.
- **`controllers/`**: Contains the business logic for each route.
- **`middlewares/`**: Implements authentication checks and error handling.
- **`utils/socket.ts`**: Manages real-time bidirectional communication.
- **`emails/`**: Templates for email notifications and password reset functionality.
- **`utils/otp.ts`**: SMS service integration for OTP and password delivery.

### 2. Mobile Structure (`mobile/app`)

Utilizes Expo Router's directory-based navigation:

- **`(auth)/`**: Handles User Onboarding (Login, Register, Phone OTP Verification).
- **`(tabs)/`**: The main app navigation (Home/Chats, Search, Status, Profile).
- **`chat/`**: Individual chat screen for real-time messaging.
- **`new-chat/`**: Interface to start new 1:1 conversations.
- **`screens/select_participates.tsx`**: Flow to create group chats by selecting multiple participants with a guided, modal-based group naming step.
- **`store/`**: Centralized state for authentication and app-wide settings.

---

## ✨ Key Features

### 👤 User Management

- **Security:**
  - Secure registration via **Phone Number** with OTP verification via SMS.
  - **Auto-Password Generation:** High-security password generated upon verification and sent to user via SMS.
  - **OTP Rate Limiting:** Enforced limit of 5 OTPs per month per user to prevent abuse.
  - **Device ID Tracking:** Retrieval of unique device identifiers (Android/iOS) for enhanced session security.
- **Profile:**
  - Customizable profiles with Cloudinary-hosted profile pictures.
  - **Profile Completion:** Mandatory name and email entry before logout for guaranteed account recovery.
- **Search:** Find other users to start conversations.

### 💬 Messaging

- **Real-time:** Instant message delivery using WebSockets.
- **Group Chats:** Create named group conversations by selecting two or more participants.
- **Message Actions:** Integrated header context bar for editing and deleting messages.
- **Soft Delete:** Support for deleting messages with a "🚫 This message was deleted" placeholder.
- **Time Limits:** Enforced 5-minute time window for editing sent messages.
- **Rich Media:** Send and preview photos, videos, and documents.
- **Status:** Share text, photo, or video updates with a polished interface and real-time online/offline indicators.
- **Custom UI Alerts:** Premium, styled confirmation and error alerts replacing standard system dialogs.
- **History:** Persistent message storage in MongoDB for viewing past conversations.
