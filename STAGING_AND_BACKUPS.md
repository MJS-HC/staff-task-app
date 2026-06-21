# Staging Environment & Backup Setup Guide

This guide covers setting up a staging environment for testing changes and configuring daily automated backups for your Firestore database.

## 📋 Table of Contents

1. [Staging Environment Setup](#staging-environment-setup)
2. [Daily Backup Configuration](#daily-backup-configuration)
3. [Backup Restoration](#backup-restoration)
4. [Testing the Backup](#testing-the-backup)

---

## 🚀 Staging Environment Setup

### Step 1: Create a Staging Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it: `your-project-staging` (or similar)
4. Follow the setup wizard
5. Create a Firestore database (same as production)
6. Set up Authentication (Email/Password)

### Step 2: Get Staging Credentials

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Copy the staging project credentials
3. In your project, update `.env.local` with staging credentials:

```bash
# Add these alongside your production config
VITE_STAGING_FIREBASE_API_KEY=your_staging_api_key
VITE_STAGING_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
VITE_STAGING_FIREBASE_PROJECT_ID=your-staging-project
VITE_STAGING_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
VITE_STAGING_FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
VITE_STAGING_FIREBASE_APP_ID=your_staging_app_id
```

### Step 3: Update Firebase Config for Multi-Environment Support

The app now supports environment switching. You can:

**Option A: Local Testing**
- Use development server with staging config
- Keep `.env.local` with staging credentials
- Run `npm run dev` to test against staging

**Option B: Deploy Separate Staging Site**
1. Create a new Netlify site for staging
2. Set environment variables in Netlify:
   - Go to **Site Settings** → **Build & Deploy** → **Environment**
   - Add staging Firebase credentials with `VITE_` prefix
3. Deploy to staging site for full end-to-end testing

### Step 4: Populate Staging with Test Data

You have two options:

**Option A: Manual Setup**
- Log in to staging Firebase Console
- Create test users and tasks directly

**Option B: Restore from Backup (if available)**
- See [Backup Restoration](#backup-restoration) section

---

## 💾 Daily Backup Configuration

### Step 1: Enable Firebase Admin SDK

1. Go to Firebase Console → **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file securely

### Step 2: Create Cloud Storage Bucket for Backups

1. In Google Cloud Console, go to **Cloud Storage**
2. Create a new bucket named: `your-project-firestore-backups`
3. Set location to match your Firestore region
4. Set default storage class to **Standard**

### Step 3: Deploy Cloud Functions

1. Install Firebase CLI (if not already):
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

2. Deploy the backup function:
```bash
cd functions
npm install
npm run deploy
```

3. Verify the function deployed:
```bash
firebase functions:list
```

You should see:
- `dailyBackup` - Runs automatically every day at 2:00 AM UTC
- `triggerBackupManual` - Callable function for on-demand backups

### Step 4: Verify Backup Schedule

1. Go to Google Cloud Console → **Cloud Scheduler**
2. Look for the scheduled job (Firebase creates this automatically)
3. You should see: `firestore-backup` scheduled for daily at 2:00 AM UTC
4. Click the job and verify it's **ENABLED**

### Step 5: Set Backup Retention Policy

The backup function automatically deletes backups older than 30 days. To change retention:

Edit `functions/backup.ts`, line ~108:
```typescript
await cleanupOldBackups(bucketName, 30); // Change 30 to desired days
```

Then redeploy:
```bash
npm run deploy
```

---

## 🔄 Backup Restoration

### Automatic Restoration (via Firebase Console)

1. Go to Firebase Console → **Firestore Database**
2. Click the **three-dot menu** → **Manage Backups**
3. Select the backup you want to restore
4. Click **Restore**
5. Wait for restoration to complete (this overwrites current data!)

### Manual Restoration via CLI

```bash
# List available backups
gcloud firestore backups list --location=us-central1

# Restore a specific backup
gcloud firestore restore BACKUP_ID --location=us-central1
```

⚠️ **WARNING**: Restoration overwrites all current data. Only restore to a staging environment first to verify!

---

## ✅ Testing the Backup

### Test 1: Verify Daily Backup

1. Go to Google Cloud Console → **Cloud Storage**
2. Navigate to `your-project-firestore-backups` bucket
3. You should see a folder with format: `firestore-backup-YYYY-MM-DD`
4. Inside should be backup metadata files

### Test 2: Trigger Manual Backup

You can manually trigger a backup from your app:

```typescript
// Call from admin-only functionality in your app
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const triggerBackup = httpsCallable(functions, 'triggerBackupManual');

// Usage (admin only)
try {
  const result = await triggerBackup({});
  console.log('Backup triggered:', result.data);
} catch (error) {
  console.error('Backup failed:', error);
}
```

### Test 3: Verify Automated Cleanup

1. Wait for more than 30 days of backups to accumulate (or test locally)
2. Check Cloud Storage bucket
3. Old backups should be automatically deleted

---

## 📊 Monitoring Backups

### Cloud Logging

View backup function logs:
```bash
firebase functions:log --follow
```

Or in Google Cloud Console:
1. Go to **Cloud Logging** → **Logs Explorer**
2. Filter by resource type: **Cloud Function**
3. Filter by function name: `dailyBackup`

### Cloud Monitoring

Set up alerts (optional):
1. Go to **Cloud Monitoring** → **Alerting Policies**
2. Create policy if backup function fails
3. Set notification channel (email, Slack, etc.)

---

## 🔐 Security Best Practices

1. **Backup Encryption**: Cloud Storage backups are encrypted by default
2. **Access Control**: Only admins should have access to backup bucket
3. **Regular Testing**: Test restoration quarterly to ensure backups work
4. **Monitoring**: Set up alerts for backup failures
5. **Retention Policy**: Don't keep backups longer than needed (cost savings)

---

## 📝 Troubleshooting

### Backup Not Running

1. Check Cloud Scheduler is enabled:
   ```bash
   gcloud scheduler jobs list
   ```

2. Check function permissions:
   ```bash
   gcloud functions describe dailyBackup --region=us-central1
   ```

3. Check Cloud Storage bucket exists and is accessible

### Restoration Taking Too Long

- Large databases can take hours to restore
- Don't interrupt the process
- Monitor progress in Firebase Console

### Insufficient Permissions Error

1. Ensure Cloud Function has `Firestore Editor` role
2. Ensure service account has `Storage Admin` role for backup bucket
3. Redeploy: `npm run deploy`

---

## 💡 Next Steps

1. **Set up staging environment** - Follow steps 1-4 above
2. **Deploy backup function** - Deploy to production
3. **Test manual backup** - Verify it works
4. **Wait for first daily backup** - Confirm automated runs
5. **Test restoration** - In staging environment only!

---

## 🆘 Need Help?

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/database/admin/start)
- [Firestore Backup & Restore](https://firebase.google.com/docs/firestore/backups)
- [Cloud Scheduler Docs](https://cloud.google.com/scheduler/docs)
