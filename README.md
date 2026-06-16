# Split Bill 💸

A beautiful, premium group expense-sharing and bill-splitting mobile application built with **React Native (Expo)** and a robust **Node.js/Express/MongoDB** backend. The application makes it easy to track group expenses, divide bills, view detailed activity feeds, and seamlessly settle balances with other group members.

---

## 🚀 Key Features

*   **Secure Authentication**: Custom user registration and login, fortified with OTP (One-Time Password) verification sent via email.
*   **Dynamic Group Management**: Create new expense groups, join existing ones using group codes, and manage active group memberships.
*   **Flexible Expense Splitting**: Add complex expenses specifying who paid and splitting the amounts automatically or manually.
*   **Simplified Settlements ("Settle Up")**: Log repayments and settlements between group members to clean up dues quickly.
*   **Interactive Activity Feed**: Stay updated with a real-time notification/activity log tracking all group transactions and changes.
*   **Modern UI/UX**: Pristine dark/light elements, smooth transitions, custom visual feedback (focus states, clean borders, custom shadows), and complete responsiveness.

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
*   **Framework**: [React Native](https://reactnative.dev/) with [Expo (SDK 56)](https://expo.dev/)
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
*   **State Management**: React Context API (`AuthContext`, `GroupContext`)
*   **Styling**: Custom modern styling using vanilla `StyleSheet` and unified design tokens in `theme.ts`
*   **Vector Icons**: `@expo/vector-icons` (Ionicons)
*   **Storage**: `@react-native-async-storage/async-storage` for local token persistence

### Backend (API Server)
*   **Runtime Environment**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
*   **Authentication**: JSON Web Tokens (JWT) & `bcryptjs` password hashing
*   **Email Deliverability**: [Nodemailer](https://nodemailer.com/) & [Resend API](https://resend.com/) for secure OTP transfers

---

## 📂 Project Directory Structure

```text
split-bill/
├── backend/                  # Node.js/Express Backend Server
│   ├── config/               # Database and configuration files
│   ├── controllers/          # Business logic handlers for each resource
│   ├── models/               # MongoDB Mongoose schemas
│   ├── routes/               # Express routing configuration
│   ├── utils/                # Helper utilities (email senders, OTP handlers)
│   ├── middlewares/          # JWT authorization and validation middlewares
│   ├── server.js             # Entry point for the backend
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # React Native Expo App
│   ├── src/
│   │   ├── app/              # Expo Router pages (Auth pages, Tab layouts, screens)
│   │   ├── constants/        # Global theme configuration (colors, spacing, typography)
│   │   ├── context/          # React Contexts (AuthContext, GroupContext)
│   │   ├── services/         # API instance (Axios client setup with token interceptors)
│   │   └── hooks/            # Custom hooks
│   ├── assets/               # Static assets (images, splash screens, icons)
│   └── package.json          # Frontend dependencies and scripts
└── README.md                 # Project Documentation (This file)
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Node.js (v18+)](https://nodejs.org/)
*   [MongoDB](https://www.mongodb.com/) (Local instance or [MongoDB Atlas Cluster](https://www.mongodb.com/cloud/atlas))
*   [Expo Go App](https://expo.dev/go) (for mobile testing) or Xcode/Android Studio (for simulators)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root and populate it with your configuration details:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_specific_password
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. The frontend is pre-configured to communicate with the deployed API in [api.ts](file:///c:/Users/admin/Desktop/Personal/split-bill/frontend/src/services/api.ts). If you want to point it to your local backend, change the return value of `getBaseUrl()`:
   ```typescript
   // To target your local backend:
   // Android Emulator: http://10.0.2.2:5000/api
   // iOS Simulator / Web: http://localhost:5000/api
   ```
4. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
5. Scan the QR code with your Expo Go app (Android/iOS) or press `w` to run on Web, `a` for Android Emulator, or `i` for iOS Simulator.

---

## 🧪 Running Type Checks

Verify TypeScript compliance in the frontend using:
```bash
cd frontend
npx tsc --noEmit
```

---

## 📄 License
This project is licensed under the MIT License - see the `frontend/LICENSE` file for details.
