# Firestore Integration Checklist

This file lists all the TODO items that need Firestore integration. Each is marked in the code with `// TODO: ...`.

## Authentication Context
**File:** `src/context/AuthContext.tsx`

- [ ] ✅ Login function - DONE
- [ ] ✅ Logout function - DONE
- [ ] Create signup function - needs to also create user document in Firestore
- [ ] Password reset - needs email verification setup

## Task Dashboard
**File:** `src/components/TaskDashboard.tsx`

### Load Tasks
```typescript
// TODO: Load tasks from Firestore
// In loadTasks() function, query collection 'tasks' and populate state
// Sort by priority field
// Handle real-time updates with onSnapshot() for live sync
```

**Implementation hint:**
```typescript
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

onSnapshot(query(collection(db, 'tasks'), orderBy('priority')), (snapshot) => {
  const loadedTasks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];
  setTasks(loadedTasks);
});
```

### Save Priority Updates
```typescript
// TODO: Save updated priorities to Firestore
// In handleDragEnd() after reordering, update each task's priority field
// Use batch write for efficiency
```

**Implementation hint:**
```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
newTasks.forEach((task, index) => {
  batch.update(doc(db, 'tasks', task.id), { priority: index + 1 });
});
await batch.commit();
```

## Task Form
**File:** `src/components/TaskForm.tsx`

### Load Users List
```typescript
// TODO: Load users from Firestore
// In loadUsers() function, query 'users' collection
// Display in dropdown for task assignment
```

**Implementation hint:**
```typescript
import { collection, query, getDocs } from 'firebase/firestore';

const usersCollection = await getDocs(collection(db, 'users'));
const usersList = usersCollection.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
})) as User[];
setUsers(usersList);
```

### Create Task
```typescript
// TODO: Create task in Firestore
// In handleSubmit(), create new document in 'tasks' collection
// Set responsibleId, allocatedById (from current user), deadline, priority
// Initial priority should be highest number + 1
```

**Implementation hint:**
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'tasks'), {
  title,
  description,
  responsibleId,
  supportId: supportId || null,
  allocatedById: user!.id,
  deadline: new Date(deadline),
  priority: tasks.length + 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  interimDeadlines: [],
  notes: []
});
```

## Task Detail
**File:** `src/components/TaskDetail.tsx`

### Add Notes
```typescript
// TODO: Add note to Firestore
// In handleAddNote(), create new note in task's notes subcollection
// Include timestamp and current user ID
// Keep notes in newest-first order
```

**Implementation hint:**
```typescript
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

await addDoc(
  collection(db, 'tasks', task.id, 'notes'),
  {
    text: newNote,
    addedBy: user!.id,
    addedByName: user!.username,
    createdAt: serverTimestamp()
  }
);
```

## Admin Panel
**File:** `src/components/AdminPanel.tsx`

### Load Users
```typescript
// TODO: Load users from Firestore
// In loadUsers() function, query 'users' collection
// Display in table with email and role
```

### Add User
```typescript
// TODO: Create new user in Firestore
// In handleAddUser(), create Firebase Auth user AND user document
// Steps:
// 1. Create auth user with createUserWithEmailAndPassword()
// 2. Create user document in 'users' collection with username, email, role
// 3. Handle errors if email already exists
```

**Implementation hint:**
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';

const authUser = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
await setDoc(doc(db, 'users', authUser.user.uid), {
  username: newUsername,
  email: newEmail,
  role: newRole,
  createdAt: serverTimestamp()
});
```

### Delete User
```typescript
// TODO: Delete user from Firestore
// In handleDeleteUser(), delete both auth user and user document
// Note: Deleting auth users requires client SDK or Cloud Functions
// For now, just delete from Firestore; auth deletion may need backend
```

### Update Role
```typescript
// TODO: Update user role in Firestore
// In handleChangeRole(), update the role field in user document
// Use updateDoc() for efficiency
```

**Implementation hint:**
```typescript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'users', userId), {
  role: newRole
});
```

## Additional Features to Implement

These are not in TODO comments but would enhance the app:

### Password Reset Page
- [ ] Create password reset page at `/reset-password`
- [ ] Use Firebase `verifyPasswordResetCode()` and `confirmPasswordReset()`
- [ ] Add link on login page

### Edit Task
- [ ] Create edit form (can reuse TaskForm)
- [ ] Load task data for editing
- [ ] Save updates to Firestore

### Interim Deadlines
- [ ] Add/edit interim deadlines in TaskDetail
- [ ] Save to task's interimDeadlines subcollection
- [ ] Display in task detail view

### Delete Tasks
- [ ] Add delete button to TaskDetail
- [ ] Confirm before deleting
- [ ] Delete from Firestore

### Real-time Updates
- [ ] Use `onSnapshot()` instead of `getDocs()` for live sync
- [ ] Tasks update across devices in real-time
- [ ] Use listeners for all collections

### Email Notifications
- [ ] Set up Cloud Functions
- [ ] Send email when task assigned
- [ ] Send deadline reminders

### Task Filters
- [ ] Filter by assigned user
- [ ] Filter by role/department
- [ ] Search by title/description

## Security Rules Reference

Your Firestore security rules allow:
- All authenticated users can READ all tasks
- Only Admin/Manager can CREATE tasks
- Only task responsible person can UPDATE their task
- Only Admin can DELETE tasks

## Testing Checklist

After implementing each feature:
- [ ] Create a test user
- [ ] Create a test task
- [ ] Assign to a user
- [ ] Add a note
- [ ] Drag to change priority
- [ ] Check Firestore console to verify data
- [ ] Log in as different user - see correct permissions
- [ ] Refresh page - data persists

## Common Patterns

### Reading Data (One-time)
```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';

const q = query(collection(db, 'tasks'), where('responsibleId', '==', userId));
const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Reading Data (Real-time)
```typescript
import { collection, query, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(query(collection(db, 'tasks')), (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setState(data);
});
// Remember to unsubscribe in useEffect cleanup
```

### Writing Data
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'tasks'), {
  title: 'New Task',
  createdAt: serverTimestamp(),
  // ... other fields
});
```

### Updating Data
```typescript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'tasks', taskId), {
  priority: 5,
  updatedAt: serverTimestamp()
});
```

### Batch Operations
```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
batch.update(doc(db, 'tasks', id1), { priority: 1 });
batch.update(doc(db, 'tasks', id2), { priority: 2 });
await batch.commit();
```

## Helpful Resources

- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Query Data](https://firebase.google.com/docs/firestore/query-data/queries)
- [Subcollections](https://firebase.google.com/docs/firestore/data-model/subcollections)
- [Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions)

---

**Total TODOs:** 8 main features
**Estimated Implementation Time:** 2-4 hours

Start with task loading, then focus on create/update operations. The UI is all ready - it's just connecting the database! 🚀
