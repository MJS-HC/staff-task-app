# Complete Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A Firebase account (free tier is sufficient)
- A Netlify account (optional, for deployment)

## Step 1: Firebase Project Setup

### Create Firebase Project

1. Visit https://console.firebase.google.com
2. Click "Create Project"
3. Enter project name (e.g., "Staff Task Manager")
4. Choose your region
5. Click "Create Project"

### Get Firebase Configuration

1. In Firebase Console, click the gear icon → Project Settings
2. Scroll to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register the app with a nickname (e.g., "Staff Task App")
5. Copy the Firebase config object

Example config (you'll get your own values):
```javascript
{
  "apiKey": "AIzaSyAbCDEFGHIJ...",
  "authDomain": "staff-tasks.firebaseapp.com",
  "projectId": "staff-tasks-abc123",
  "storageBucket": "staff-tasks-abc123.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abcdef..."
}
```

## Step 2: Enable Authentication

1. In Firebase Console → Authentication → Get Started
2. Click "Email/Password" provider
3. Toggle "Enable" and click Save

## Step 3: Create Firestore Database

1. In Firebase Console → Firestore Database → Create Database
2. Start in **Production mode** (we'll add security rules)
3. Choose region closest to your location
4. Click "Create"

## Step 4: Set Firestore Security Rules

1. In Firestore Database → Rules tab
2. Replace the rules with the following:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == userId || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null && 
                       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
      allow update: if request.auth.uid != null &&
                       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager' ||
                        request.auth.uid == resource.data.responsibleId);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Interim deadlines sub-collection
      match /interimDeadlines/{docId} {
        allow read: if request.auth.uid != null;
        allow create, update, delete: if request.auth.uid != null;
      }

      // Notes sub-collection
      match /notes/{noteId} {
        allow read: if request.auth.uid != null;
        allow create: if request.auth.uid != null;
        allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
  }
}
```

3. Click "Publish"

## Step 5: Create First Admin User

### Create in Firebase Auth

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email: `admin@yournursery.com` (or your choice)
4. Enter a temporary password
5. Click "Add user"
6. Note the User ID (shown in the user list)

### Create User Document in Firestore

1. Go to Firestore Database
2. Create a new collection called `users`
3. Create a new document with the User ID from step 5
4. Add these fields:
   - `username`: `admin`
   - `email`: `admin@yournursery.com`
   - `role`: `admin`
   - `createdAt`: Set to current date/time

5. Click "Save"

## Step 6: Configure Local Environment

1. In the project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAbCDEFGHIJ...
   VITE_FIREBASE_AUTH_DOMAIN=staff-tasks.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=staff-tasks-abc123
   VITE_FIREBASE_STORAGE_BUCKET=staff-tasks-abc123.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
   ```

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Test Locally

```bash
npm run dev
```

Visit http://localhost:5173 and log in with:
- Email: `admin@yournursery.com`
- Password: (the temporary password you set)

## Deployment to Netlify

### Via GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/staff-task-app
   git push -u origin main
   ```

2. Go to https://app.netlify.com/signup
3. Sign up with GitHub
4. Click "New site from Git"
5. Select your GitHub repo
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Advanced" and add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

   (Add your Firebase credentials for each)

8. Click "Deploy site"

### Via Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir dist
```

## Adding Users

As an admin, you can:

1. Go to the Admin panel
2. Click "Add User"
3. Enter username, email, password, and role
4. Click "Add User"

Users can reset their password using Firebase's password reset flow (to be implemented in the app).

## Troubleshooting

### "Firebase config not provided"
- Check `.env.local` has all Firebase credentials
- Restart dev server after adding env vars

### "Permission denied" errors
- Check Firestore security rules are published
- Verify user document exists in `users` collection
- Check user has correct role

### Tasks not loading
- Check user has a document in Firestore `users` collection
- Check Firestore security rules allow read access
- Open browser console for error details

## Next Steps

- [ ] Complete Firestore integration in components (marked with TODO)
- [ ] Add password reset page to login
- [ ] Add task editing functionality
- [ ] Add interim deadline management
- [ ] Add email notifications (Firebase Cloud Functions)
- [ ] Add dark mode support

## Support

For Firebase help: https://firebase.google.com/docs
For Netlify help: https://docs.netlify.com
