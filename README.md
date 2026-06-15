# Staff Priority Task Manager

A modern, responsive web application for managing staff tasks at a nursery. Built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

✅ **Task Management**
- Create, edit, and delete tasks
- Drag-and-drop priority ordering
- Sort by priority or due date
- Interim deadlines with descriptions
- Time-stamped notes (most recent first)

✅ **User Roles**
- **Administrator**: Full access to all tasks, user management, role assignment
- **Manager**: Can manage tasks and users (except admin functions)
- **Carer**: Can view all tasks, but only manage their own

✅ **User Management**
- Create/delete users
- Assign roles (Admin, Manager, Carer)
- Password reset functionality
- User authentication with Firebase Auth

✅ **Responsive Design**
- Works on desktop and mobile devices
- Touch-friendly drag-and-drop
- Tailwind CSS for modern UI

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: dndkit
- **Backend**: Firebase (Auth + Firestore)
- **Hosting**: Netlify
- **Build Tool**: Vite

## Quick Start

### 1. Set Up Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Create a Firestore database
4. Copy your config from Project Settings

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Add your Firebase credentials to `.env.local`

### 3. Install & Run

```bash
npm install
npm run dev
```

## Deployment

### Deploy to Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set build: `npm run build`, publish: `dist`
4. Add environment variables in Netlify
5. Deploy!

## Project Structure

```
src/
├── components/       # React components
├── context/         # Auth state management
├── config/          # Firebase config
├── types/           # TypeScript types
└── App.tsx          # Main app
```

See README-FULL.md for complete setup instructions.
```
