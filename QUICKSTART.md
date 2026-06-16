# Quick Start - Staff Task Manager

You're ready to build! Here's what you need to do to get running:

## 5-Minute Setup

### 1. Create Firebase Project (2 min)
- Go to https://console.firebase.google.com
- Click "Create Project"
- Give it a name (e.g., "Staff Tasks")
- Click "Create Project"

### 2. Get Your Config (2 min)
- Click gear ⚙️ → Project Settings
- Scroll down to "Your apps"
- Click web icon (</>) and register app
- Copy your config values
- You'll need these 6 keys:
  - apiKey
  - authDomain
  - projectId
  - storageBucket
  - messagingSenderId
  - appId

### 3. Set Up Your .env File (1 min)
```bash
# In the staff-task-app folder:
cp .env.example .env.local
```

Edit `.env.local` and paste your Firebase config:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Enable Firebase Auth
- In Firebase Console → Authentication → Get Started
- Click "Email/Password"
- Toggle "Enable"
- Click "Save"

### 5. Create Firestore Database
- In Firebase Console → Firestore Database
- Click "Create Database"
- Select "Production mode"
- Pick your region
- Click "Create"

### 6. Add Security Rules
- Go to Firestore → Rules tab
- Copy rules from SETUP.md (full Firestore rules section)
- Paste and click "Publish"

### 7. Create First Admin User
In Firebase Console → Authentication → Users:
1. Click "Add user"
2. Email: `admin@example.com`
3. Password: `tempPassword123`
4. Copy the User ID from the users list

Then in Firestore:
1. Create a collection called `users`
2. Create a new document with that User ID
3. Add these fields:
   - username: "admin"
   - email: "admin@example.com"
   - role: "admin"
   - createdAt: (today's date)

### 8. Run Locally
```bash
npm install
npm run dev
```

Visit http://localhost:5173 and log in with:
- Email: `admin@example.com`
- Password: `tempPassword123`

## What's Built

✅ **Authentication**
- Login page with Firebase Auth
- Protected routes based on user role
- Auto logout on session end

✅ **Task Management Dashboard**
- View all tasks
- Drag-and-drop to set priority
- Sort by priority or due date
- Task detail view with full info

✅ **Admin Panel**
- Add/delete users
- Change user roles
- User management interface

✅ **UI Components**
- Responsive design (mobile + desktop)
- Task cards with status indicators
- Forms for creating tasks
- Modal for task details

## What Needs Firestore Integration

These features have TODO comments and need you to integrate with Firestore:

1. **Load tasks** - Get tasks from Firestore in TaskDashboard
2. **Save priority changes** - When you drag tasks, save to Firestore
3. **Create tasks** - Save new tasks to Firestore
4. **Add notes** - Save task notes with timestamp and user
5. **Manage users** - Load, add, delete users in AdminPanel
6. **Load users list** - For task assignment dropdown

All the UI is ready! Just need to connect the Firebase database operations.

## File Structure

```
src/
├── components/
│   ├── Login.tsx           # ✅ Authentication
│   ├── TaskDashboard.tsx   # ✅ Main view (needs data integration)
│   ├── TaskCard.tsx        # ✅ Task display
│   ├── TaskDetail.tsx      # ✅ Detailed view
│   ├── TaskForm.tsx        # ✅ Create/edit form
│   ├── AdminPanel.tsx      # ✅ User management
│   └── ProtectedRoute.tsx  # ✅ Role-based access
├── context/
│   └── AuthContext.tsx     # ✅ Auth state
├── config/
│   └── firebase.ts         # ✅ Firebase setup
└── types/
    └── index.ts            # ✅ TypeScript types
```

## Deploy to Netlify (2 minutes later)

When you're ready:

1. Push to GitHub
2. Go to netlify.com
3. Click "New site from Git"
4. Select your repo
5. Build: `npm run build`, Publish: `dist`
6. Add your .env variables
7. Deploy!

Your app will have a live URL like: `your-app.netlify.app`

## Database Schema

Ready to use:

```
users/
  {userId}/
    username: string
    email: string
    role: "admin" | "manager" | "carer"
    createdAt: timestamp

tasks/
  {taskId}/
    title: string
    description: string
    responsibleId: string
    supportId?: string
    allocatedById: string
    deadline: date
    priority: number
    createdAt: timestamp
    updatedAt: timestamp
    interimDeadlines/
      {id}/
        dueDate: date
        description: string
    notes/
      {id}/
        text: string
        addedBy: string
        createdAt: timestamp
```

## Tips

- Check browser console (F12) for errors
- Firebase gives clear error messages
- Firestore rules block bad requests on purpose (security)
- Create a few test users to see the app in action
- Mobile-responsive design - test on phone too

## Next Steps

1. ✅ Get Firebase running
2. ✅ Create first admin user
3. ✅ Run `npm run dev` and log in
4. 🚀 Add Firestore integration (see TODO comments in code)
5. 🚀 Deploy to Netlify

## Support

- Firebase docs: https://firebase.google.com/docs
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com
- This project's SETUP.md for detailed steps

Good luck! You've got a solid foundation - just connect the database and you're live. 🚀
