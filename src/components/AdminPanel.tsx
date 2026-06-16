import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../config/firebase';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'carer'>('carer');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const loadedUsers: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        email: doc.data().email,
        role: doc.data().role,
        createdAt: doc.data().createdAt.toDate(),
      }));
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setLoading(false);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) return;

    try {
      // Create Firebase Auth user
      const authUser = await createUserWithEmailAndPassword(
        auth,
        newEmail,
        newPassword
      );

      // Create user document in Firestore with the auth user's UID as document ID
      await setDoc(doc(db, 'users', authUser.user.uid), {
        username: newUsername,
        email: newEmail,
        role: newRole,
        createdAt: serverTimestamp(),
      });

      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setShowAddUser(false);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to add user:', error);
      alert(error.message || 'Failed to create user');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      // Find the user by ID and delete from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDoc = usersSnapshot.docs.find((d) => d.id === userId);

      if (userDoc) {
        await deleteDoc(doc(db, 'users', userDoc.id));
      }

      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    try {
      // Find the user by ID and update their role
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDoc = usersSnapshot.docs.find((d) => d.id === userId);

      if (userDoc) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: newRole,
        });
      }

      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-red-600">You don't have permission to access this page</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="btn-primary"
        >
          {showAddUser ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showAddUser && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New User</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="input-field">
                  <option value="carer">Carer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add User
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">{u.username}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      disabled={u.id === currentUser?.id}
                    >
                      <option value="carer">Carer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
