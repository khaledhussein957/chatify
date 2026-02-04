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
- **`emails/`**: Templates for OTP and password reset functionality.

### 2. Mobile Structure (`mobile/app`)

Utilizes Expo Router's directory-based navigation:

- **`(auth)/`**: Handles User Onboarding (Login, Register, OTP Verification).
- **`(tabs)/`**: The main app navigation (Home/Chats, Search, Profile).
- **`chat/`**: Individual chat screen for real-time messaging.
- **`new-chat/`**: Interface to start new conversations.
- **`store/`**: Centralized state for authentication and app-wide settings.

---

## ✨ Key Features

### 👤 User Management

- **Security:** Secure registration with OTP verification via email.
- **Profile:** Customizable profiles with Cloudinary-hosted profile pictures.
- **Search:** Find other users to start conversations.

### 💬 Messaging

- **Real-time:** Instant message delivery using WebSockets.
- **Chat Types:** Support for private messaging (1-on-1).
- **Status:** Real-time online/offline presence indicators.
- **History:** Persistent message storage in MongoDB for viewing past conversations.
