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
- **UI/UX:** React Native `StyleSheet` with a **Dynamic Theme System** supporting Light and Dark modes.

---

## 🏗️ System Architecture

### 1. Backend Structure (`backend/src`)

The backend follows a modular architecture:

- **`models/`**: Defines the data schema for Users, Chats, Messages, and Statuses.
- **`routes/`**: Handles API endpoints for Authentication, Users, Chats, Messages, and Statuses.
- **`controllers/`**: Contains the business logic for real-time interaction and data management.
- **`middlewares/`**: Implements global authentication checks and request validation.
- **`utils/socket.ts`**: Manages real-time bidirectional communication with online/offline state tracking.
- **`emails/`**: Templates for email notifications and secure password delivery.

### 2. Mobile Structure (`mobile/app`)

Utilizes Expo Router's directory-based navigation:

- **`(auth)/`**: Handles User Onboarding (Login, Register, Phone OTP Verification).
- **`(tabs)/`**: The main app navigation (Home, Status, Group, Profile) fully synced with the dynamic theme.
- **`chat/`**: Individual chat screen with real-time messaging, editing, and media sharing.
- **`screens/`**: Standalone flows for Profile editing, Status viewing, and Group creation.
- **`lib/socket.ts`**: Centralized Socket.io client management with React Query integration.

---

## ✨ Key Features

### 👤 User Management

- **Security:**
  - Secure registration via **Phone Number** with OTP verification.
  - **Auto-Password Generation:** Secure passwords generated and delivered via SMS/Email.
  - **Device ID Tracking:** Multi-device session security and identification.
- **Profile:**
  - **Dynamic Theming:** Smooth transition between Light and Dark modes with persistent user preference.
  - Customizable profiles with Cloudinary-hosted media.
- **Account Deletion:** Robust "Right to be Forgotten" implementation with automated cleanup of messages, media, and metadata synchronization to prevent dangling references.

### 💬 Messaging

- **Real-time:** Instant delivery with bidirectional state updates (Typing, Recording, Online/Offline).
- **Group Chats:** Feature-rich group management with admin transfers, member removal, and real-time membership notifications.
- **Message Reactions:** Add emoji reactions to any message with real-time synchronization and toggle functionality.
- **Media Downloads:** Save shared images, videos, and documents directly to your device with integrated progress tracking.
- **Search System:** Efficient header-integrated search across all chats and groups for quick navigation.
- **Voice Messages:** Record and play voice notes with integrated progress tracking and duration awareness.
- **Message Actions:** Edit and delete support with placeholders for deleted content to maintain conversation flow.
- **Rich Media:** Seamless sharing of Photos, Videos, and Documents with immersive viewers.
- **Status:** Share temporary text/media updates with a dedicated browser-like progress interface.
- **Reliability:** Custom network error handling and connection state awareness for a seamless experience.
- **Custom UI System:** Premium, theme-aware alerts and modals replacing generic native dialogs for a consistent "Chatify" experience.
- **Data Integrity:** Reliable message history with automatic metadata re-syncing during participant departures.
