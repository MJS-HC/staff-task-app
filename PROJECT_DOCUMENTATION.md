# Staff Task Manager - Complete Project Documentation

A modern, responsive web application for managing staff tasks at a nursery. This document contains everything needed to understand, set up, and deploy the application on a new device.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Features](#features)
4. [Directory Structure](#directory-structure)
5. [Firebase Setup](#firebase-setup)
6. [Environment Variables](#environment-variables)
7. [Database Schema](#database-schema)
8. [Security Rules](#firestore-security-rules)
9. [Deployment](#deployment)
10. [Setup on New Device](#setup-on-new-device)
11. [Cloud Functions & Backups](#cloud-functions--backups)
12. [Troubleshooting](#troubleshooting)

---

## 📱 Project Overview

**Project Name:** Staff Priority Task Manager  
**Purpose:** Manage staff tasks and priorities at a nursery setting  
**Type:** Web Application (React + TypeScript)  
**Hosting:** Netlify  
**Database:** Firebase Firestore  
**Authentication:** Firebase Auth  
**Live URL:** https://staff-task-app.netlify.app  
**Repository:** https://github.com/MJS-HC/staff-task-app

### Key Features

✅ Create, edit, and delete tasks  
✅ Drag-to-prioritize with automatic numbering  
✅ Sort tasks by priority or due date  
✅ Add interim deadlines and timestamped notes  
✅ Three user roles with different permissions  
✅ User management system  
✅ Responsive mobile-friendly design  
✅ Real-time data synchronization  
✅ Daily automated backups  
✅ Staging environment support  

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS v4** - Styling
- **React Router DOM** - Navigation
- **dnd-kit** - Drag and drop library

### Backend & Services
- **Firebase Authentication** - User login/registration
- **Firestore** - Real-time NoSQL database
- **Google Cloud Functions** - Scheduled backups
- **Cloud Storage** - Backup storage

### Deployment
- **Netlify** - Frontend hosting
- **Google Cloud** - Backend services

### Version Details
```json
{
  "react": "^19.2.6",
  "typescript": "~6.0.2",
  "vite": "^8.0.12",
  "firebase": "^12.14.0",
  "tailwindcss": "^4.3.1",
  "@dnd-kit/core": "^6.3.1",
  "react-router-dom": "^7.17.0"
}
```

---

## ✨ Features in Detail

### 1. **Task Management**
- Create tasks with title, description, deadline, and optional interim deadlines
- Edit task details (title, description)
- Delete tasks (admin/manager only)
- Add timestamped notes to tasks
- Edit and delete notes (author or admin/manager)
- Support person assignment for additional help

### 2. **Priority System**
- Per-user priority numbering (#1, #2, #3, etc.)
- Drag-to-reorder to change priorities
- Automatic renumbering when tasks reassigned
- Visual priority display in task cards

### 3. **User Roles & Permissions**

**Admin**
- Create, edit, delete all tasks
- Manage all users (create, delete, change roles)
- Reset passwords
- View all tasks
- Assign tasks to anyone
- Reassign tasks between users

**Manager**
- Create, edit, delete tasks
- Manage users (limited)
- View all tasks
- Assign tasks to team members
- Cannot assign admin roles

**Carer**
- View all tasks
- Create notes on any task
- Only edit/delete their own tasks
- Cannot create new tasks
- Cannot reassign tasks

### 4. **Real-Time Features**
- Live task updates across devices
- Real-time note synchronization
- Live user list updates
- Automatic refresh on modal close

### 5. **Data Organization**
- Tasks grouped by assigned staff member
- Unassigned tasks in separate column (admin/manager only)
- Color-coded headers by assigned person
- Column-based dashboard layout

---

## 📁 Directory Structure

```
staff-task-app/
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx        # User management interface
│   │   ├── Login.tsx             # Login form
│   │   ├── TaskCard.tsx          # Individual task card (draggable)
│   │   ├── TaskDashboard.tsx     # Main dashboard (multi-column layout)
│   │   ├── TaskDetail.tsx        # Task view/edit modal
│   │   ├── TaskForm.tsx          # Create new task form
│   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.tsx       # User auth state & functions
│   ├── config/
│   │   └── firebase.ts           # Firebase initialization
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # Global styles
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Base styles
├── functions/
│   ├── backup.ts                 # Daily backup Cloud Function
│   ├── package.json              # Function dependencies
│   └── tsconfig.json             # TypeScript config
├── public/
│   └── (static assets)
├── .env.example                  # Environment template
├── .env.local                    # Local env vars (not committed)
├── netlify.toml                  # Netlify configuration
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.js             # PostCSS configuration
├── README.md                      # Quick start guide
├── STAGING_AND_BACKUPS.md        # Setup staging & backup docs
└── PROJECT_DOCUMENTATION.md      # This file
```

---

## 🔐 Firebase Setup

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `staff-task-app` (or your preference)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get Started"**
3. Click **Email/Password** sign-in method
4. Toggle **"Enable"** and **"Enable email link (passwordless sign-in)"** (optional)
5. Click **"Save"**

### Step 3: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **"Create Database"**
3. Choose region (closest to you recommended)
4. Select **"Production mode"** for security rules
5. Click **"Create"**

### Step 4: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click the **Web** icon (</>) to add web app
4. Register app with name `staff-task-app`
5. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 5: Create Storage Bucket (for backups)

1. Go to **Build** → **Storage**
2. Click **"Get Started"**
3. Create a bucket named: `your-project-firestore-backups`
4. Choose same region as Firestore
5. Set to **Standard** storage class

---

## 🔑 Environment Variables

### `.env.local` (Production)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### `.env.staging` (Staging - Optional)

```bash
# Staging Firebase Configuration
VITE_STAGING_FIREBASE_API_KEY=your_staging_api_key
VITE_STAGING_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
VITE_STAGING_FIREBASE_PROJECT_ID=your-staging-project-id
VITE_STAGING_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
VITE_STAGING_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
VITE_STAGING_FIREBASE_APP_ID=your_staging_app_id
```

### Firebase Config Code

The app loads Firebase config from environment variables in `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 🗄️ Database Schema

### Firestore Collections Structure

#### `users` Collection
Stores user accounts and roles.

```typescript
users/{userId}
{
  username: string              // User display name
  email: string                 // User email
  role: 'admin' | 'manager' | 'carer'  // User role
  createdAt: timestamp          // Account creation time
  lastLogin?: timestamp         // Last login time (optional)
}
```

#### `tasks` Collection
Stores task data and metadata.

```typescript
tasks/{taskId}
{
  title: string                 // Task name
  description: string           // Task details
  responsibleId: string         // Assigned staff member ID
  supportId?: string           // Support person ID (optional)
  allocatedById: string        // Admin who created the task
  deadline: timestamp          // Task due date
  priority: number             // Priority number (per user: 1, 2, 3...)
  createdAt: timestamp         // When task was created
  updatedAt: timestamp         // Last update time
  interimDeadlines: array      // Sub-deadlines
  notes: array                 // Notes subcollection reference
}
```

#### `tasks/{taskId}/notes` Subcollection
Notes on individual tasks.

```typescript
tasks/{taskId}/notes/{noteId}
{
  text: string                 // Note content
  addedBy: string              // User ID who added note
  addedByName: string          // User name who added note
  createdAt: timestamp         // When note was added
}
```

#### `tasks/{taskId}/interimDeadlines` (Embedded Array)
```typescript
{
  id: string                   // Deadline ID
  dueDate: timestamp          // Due date
  description: string         // What's due
}
```

---

## 🔒 Firestore Security Rules

### Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isManager() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
    
    function isAuthenticated() {
      return request.auth.uid != null;
    }

    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read users
      allow read: if isAuthenticated();
      
      // Users can update their own profile
      allow update: if request.auth.uid == userId;
      
      // Only admins can delete users
      allow delete: if isAdmin();
      
      // Only admins can create users
      allow create: if isAdmin() || !exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    // Tasks collection
    match /tasks/{taskId} {
      // Anyone authenticated can read tasks
      allow read: if isAuthenticated();
      
      // Admin and manager can create tasks
      allow create: if isAuthenticated() && (isAdmin() || isManager());
      
      // Admin and manager can update tasks
      allow update: if isAuthenticated() && (isAdmin() || isManager());
      
      // Only admin can delete tasks
      allow delete: if isAdmin();

      // Notes subcollection
      match /notes/{noteId} {
        // Anyone authenticated can read notes
        allow read: if isAuthenticated();
        
        // Anyone authenticated can create notes
        allow create: if request.auth.uid != null && (
          isAdmin() || 
          isManager() ||
          request.auth.uid == get(/databases/$(database)/documents/tasks/$(taskId)).data.responsibleId
        );
        
        // Users can delete their own notes, admins/managers can delete any
        allow delete: if request.auth.uid == resource.data.addedBy || isAdmin() || isManager();
        
        // Users can update their own notes, admins/managers can update any
        allow update: if request.auth.uid != null && (
          request.auth.uid == resource.data.addedBy || 
          isAdmin() || 
          isManager()
        );
      }
    }
  }
}
```

### How to Apply Rules

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Replace the rules with the above
3. Click **"Publish"**

---

## 🚀 Deployment

### Deploy to Netlify

#### Option 1: Connect GitHub Repository

1. Push code to GitHub: https://github.com/MJS-HC/staff-task-app
2. Go to https://app.netlify.com
3. Click **"New site from Git"**
4. Select **GitHub** and authorize
5. Select repository: `staff-task-app`
6. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"**

#### Option 2: Set Environment Variables in Netlify

1. Go to your Netlify site
2. **Site Settings** → **Build & Deploy** → **Environment**
3. Add these variables:
   ```
   VITE_FIREBASE_API_KEY=your_value
   VITE_FIREBASE_AUTH_DOMAIN=your_value
   VITE_FIREBASE_PROJECT_ID=your_value
   VITE_FIREBASE_STORAGE_BUCKET=your_value
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
   VITE_FIREBASE_APP_ID=your_value
   ```

#### Option 3: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Netlify Configuration

The `netlify.toml` file configures Netlify:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures all routes redirect to `index.html` for React Router to handle client-side routing.

---

## 🖥️ Setup on New Device

### Prerequisites

- Node.js v18+ (https://nodejs.org)
- Git (https://git-scm.com)
- Firebase CLI (optional, for Cloud Functions)
- VS Code (recommended)

### Step-by-Step Setup

#### 1. Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/MJS-HC/staff-task-app.git
cd staff-task-app

# Or copy from existing installation
cp -r C:\Users\matth\Development\Projects\staff-task-app .
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# (See Environment Variables section above)
```

#### 4. Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:5173**

#### 5. Build for Production

```bash
npm run build
npm run preview
```

#### 6. Deploy to Netlify

```bash
# Via CLI
npm install -g netlify-cli
netlify deploy --prod

# Or push to GitHub and connect to Netlify
git push origin main
```

---

## ☁️ Cloud Functions & Backups

### Daily Backup Function

The app includes automated daily Firestore backups to Google Cloud Storage.

#### Setup Cloud Functions

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Deploy Functions**
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

3. **Create Storage Bucket**
   - Go to Google Cloud Console → Cloud Storage
   - Create bucket: `your-project-firestore-backups`

4. **Verify Deployment**
   ```bash
   firebase functions:list
   ```

You should see:
- `dailyBackup` - Runs every day at 2:00 AM UTC
- `triggerBackupManual` - On-demand backup trigger

#### Backup Function Code

```typescript
// functions/backup.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";

admin.initializeApp();

const db = admin.firestore();
const storage = new Storage();

/**
 * Daily Firestore backup function
 * Runs every day at 2:00 AM UTC
 */
export const dailyBackup = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const bucketName = `${projectId}-firestore-backups`;
      const timestamp = new Date().toISOString().split("T")[0];
      const backupPath = `firestore-backup-${timestamp}`;

      const client = new admin.firestore.v1.FirestoreAdminClient();
      const databaseName = client.databasePath(projectId, "(default)");

      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: `gs://${bucketName}/${backupPath}`,
        collectionIds: [],
      });

      // Cleanup old backups (older than 30 days)
      await cleanupOldBackups(bucketName, 30);

      console.log("Firestore backup completed successfully");
      return { success: true, backupPath };
    } catch (error) {
      console.error("Backup failed:", error);
      throw error;
    }
  });
```

#### View Backup Logs

```bash
firebase functions:log --follow
```

#### Restore from Backup

1. Go to Firebase Console → Firestore Database
2. Click menu → **Manage Backups**
3. Select backup and click **Restore**

⚠️ **Warning:** Restoration overwrites all current data!

---

## 🎯 Key Code Files

### Authentication (`src/context/AuthContext.tsx`)

Manages user login, signup, and session state using Firebase Auth.

### Task Components

- **TaskDashboard.tsx** - Main dashboard with multi-column layout
- **TaskCard.tsx** - Individual task card (draggable with dnd-kit)
- **TaskDetail.tsx** - View/edit task modal
- **TaskForm.tsx** - Create new task form
- **AdminPanel.tsx** - User management interface

### Styling

- **Tailwind CSS** for responsive design
- **Color-coded headers** based on assigned user
- **Mobile-first design** approach
- **8-color palette** for user differentiation

---

## 🔄 Git Workflow

### Development Workflow

```bash
# Get latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
# After review, merge to main
```

### Deploy Changes

1. Merge PR to main branch
2. Netlify auto-deploys from GitHub
3. Check deployment status at https://app.netlify.com

---

## 🐛 Troubleshooting

### "Firebase config missing"
- Check `.env.local` exists and has all Firebase variables
- Restart dev server after adding environment variables

### "User not found in Firestore"
- New users are auto-created on first login
- Check Firestore database has users collection

### "Notes not saving"
- Check Firestore rules allow create on notes subcollection
- Ensure user has proper role (admin, manager, or task owner)

### "Drag-and-drop not working"
- dnd-kit library requires specific event handling
- Check browser console for errors

### "Deploy fails on Netlify"
- Verify environment variables are set in Netlify
- Check build command: `npm run build`
- Verify publish directory: `dist`

### "Real-time updates not working"
- Check Firestore security rules allow read access
- Verify user is authenticated
- Check browser network tab for Firebase connection

---

## 📞 Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **dnd-kit**: https://docs.dndkit.com
- **GitHub Repo**: https://github.com/MJS-HC/staff-task-app

---

## 📝 License

See LICENSE.md for license information.

---

**Last Updated**: 2026-06-27  
**Version**: 1.0.0  
**Maintained By**: Matthew Swindells
