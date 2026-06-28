import React, { useState, useEffect } from 'react';
import type { User, PermissionAction, PermissionLevel, UserRole } from '../types';
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
  query,
  where,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const ROLES: { value: UserRole; label: string; grade: number }[] = [
  { value: 'eye', label: 'EYE (Early Years Educator)', grade: 1 },
  { value: 'office-manager', label: 'Office Manager', grade: 2 },
  { value: 'senior-staff', label: 'Senior Staff', grade: 3 },
  { value: 'deputy-manager', label: 'Deputy Manager', grade: 4 },
  { value: 'nursery-manager', label: 'Nursery Manager', grade: 5 },
];

const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'add', 'edit', 'prioritise', 'move'];
const PERMISSION_LEVELS: PermissionLevel[] = ['none', 'self', 'below', 'own-and-below', 'all'];

const ACTION_LABELS: Record<PermissionAction, string> = {
  'view': 'View Tasks',
  'add': 'Add a Task',
  'edit': 'Edit a Task and Add Notes',
  'prioritise': 'Prioritise Tasks',
  'move': 'Move Tasks Between Staff',
};

const LEVEL_LABELS: Record<PermissionLevel, string> = {
  'none': 'No-one',
  'self': 'Own only',
  'below': 'Self and more junior grades',
  'own-and-below': 'Own grade and more junior',
  'all': 'Everyone',
};

const DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionAction, PermissionLevel>> = {
  'eye': { view: 'self', add: 'none', edit: 'self', prioritise: 'none', move: 'none' },
  'office-manager': { view: 'self', add: 'none', edit: 'self', prioritise: 'none', move: 'none' },
  'senior-staff': { view: 'own-and-below', add: 'self', edit: 'own-and-below', prioritise: 'own-and-below', move: 'none' },
  'deputy-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'nursery-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'admin': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'carer': { view: 'self', add: 'none', edit: 'self', prioritise: 'none', move: 'none' },
};

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('eye');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [sortColumn, setSortColumn] = useState<'username' | 'email' | 'role' | 'admin'>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Record<PermissionAction, PermissionLevel>>>(DEFAULT_PERMISSIONS);
  const [unsavedRoles, setUnsavedRoles] = useState<Set<UserRole>>(new Set());
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const loadedUsers: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        email: doc.data().email,
        role: doc.data().role,
        isAdmin: doc.data().isAdmin || false,
        createdAt: doc.data().createdAt.toDate(),
      }));
      setUsers(loadedUsers);

    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) return;

    try {
      const authUser = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      await setDoc(doc(db, 'users', authUser.user.uid), {
        username: newUsername,
        email: newEmail,
        role: newRole,
        isAdmin: newIsAdmin,
        createdAt: serverTimestamp(),
      });

      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('eye');
      setNewIsAdmin(false);
      setShowAddUser(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to add user:', error);
      alert(error.message || 'Failed to create user');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    try {
      console.log('Updating user role:', userId, newRole);
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      console.log('Role updated successfully');
      loadData();
      alert(`Role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(`Error updating role: ${error.message}`);
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    try {
      console.log('Toggling admin status:', userId, 'current:', isAdmin, 'new:', !isAdmin);
      await updateDoc(doc(db, 'users', userId), { isAdmin: !isAdmin });
      console.log('Admin status updated successfully');
      loadData();
      alert(`Admin status updated to ${!isAdmin}`);
    } catch (error: any) {
      console.error('Failed to toggle admin status:', error);
      alert(`Error updating admin status: ${error.message}`);
    }
  }

  async function handleUpdateUsername(userId: string, newUsername: string, silent = false) {
    if (!newUsername.trim()) {
      if (!silent) alert('Username cannot be empty');
      return false;
    }

    try {
      console.log('Updating username:', userId, newUsername);
      await updateDoc(doc(db, 'users', userId), { username: newUsername });
      console.log('Username updated successfully');
      if (!silent) {
        setEditingUserId(null);
        loadData();
        alert('Username updated successfully');
      }
      return true;
    } catch (error: any) {
      console.error('Failed to update username:', error);
      if (!silent) alert(`Error updating username: ${error.message}`);
      return false;
    }
  }

  async function handleUpdateEmail(userId: string, newEmail: string, silent = false) {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      if (!silent) alert('Please enter a valid email address');
      return false;
    }

    try {
      console.log('Updating email:', userId, newEmail);
      await updateDoc(doc(db, 'users', userId), { email: newEmail });
      console.log('Email updated successfully');
      if (!silent) {
        setEditingUserId(null);
        loadData();
        alert('Email updated successfully in Firestore. User should update their email in Firebase Auth settings.');
      }
      return true;
    } catch (error: any) {
      console.error('Failed to update email:', error);
      if (!silent) alert(`Error updating email: ${error.message}`);
      return false;
    }
  }

  async function handleResetPassword(userEmail: string) {
    try {
      console.log('Sending password reset email to:', userEmail);
      await sendPasswordResetEmail(auth, userEmail);
      alert(`Password reset email sent to ${userEmail}. User will receive instructions to reset their password.`);
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      alert(`Error sending password reset email: ${error.message}`);
    }
  }

  function startEditingUser(user: User) {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email);
  }

  function cancelEditing() {
    setEditingUserId(null);
    setEditUsername('');
    setEditEmail('');
  }

  async function handleSaveUserChanges(user: User) {
    const usernameChanged = editUsername !== user.username;
    const emailChanged = editEmail !== user.email;

    if (!usernameChanged && !emailChanged) {
      alert('No changes to save');
      setEditingUserId(null);
      return;
    }

    try {
      const results = [];
      if (usernameChanged) {
        const result = await handleUpdateUsername(user.id, editUsername, true);
        results.push({ field: 'Username', success: result });
      }
      if (emailChanged) {
        const result = await handleUpdateEmail(user.id, editEmail, true);
        results.push({ field: 'Email', success: result });
      }

      // Build success message based on what was updated
      const successMessages = results.filter(r => r.success).map(r => r.field);
      if (successMessages.length > 0) {
        const message = successMessages.join(' and ') + ' updated successfully';
        if (emailChanged) {
          alert(message + '. User should update their email in Firebase Auth settings if email was changed.');
        } else {
          alert(message);
        }
      }

      setEditingUserId(null);
      loadData();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes');
    }
  }

  function handleColumnSort(column: 'username' | 'email' | 'role' | 'admin') {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  function getSortedUsers() {
    const sorted = [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'username') {
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
      } else if (sortColumn === 'email') {
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
      } else if (sortColumn === 'role') {
        const roleGrades: Record<UserRole, number> = {
          'eye': 1,
          'office-manager': 2,
          'senior-staff': 3,
          'deputy-manager': 4,
          'nursery-manager': 5,
          'admin': 5,
          'manager': 4,
          'carer': 1,
        };
        aValue = roleGrades[a.role] || 0;
        bValue = roleGrades[b.role] || 0;
      } else if (sortColumn === 'admin') {
        aValue = a.isAdmin ? 1 : 0;
        bValue = b.isAdmin ? 1 : 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }

  function renderSortIndicator(column: 'username' | 'email' | 'role' | 'admin') {
    if (sortColumn !== column) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  async function handleSavePermissions(role: UserRole, permissions: Record<PermissionAction, PermissionLevel>) {
    try {
      const roleDoc = await getDocs(query(collection(db, 'roles'), where('name', '==', role)));
      const roleDefIndex = ROLES.findIndex(r => r.value === role);
      if (!roleDoc.empty) {
        await updateDoc(doc(db, 'roles', roleDoc.docs[0].id), {
          permissions,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'roles', role), {
          name: role,
          grade: ROLES[roleDefIndex].grade,
          permissions,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      loadData();
    } catch (error) {
      console.error('Failed to save permissions:', error);
    }
  }

  if (!currentUser?.isAdmin && currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
    return (
      <div className="p-6">
        <p className="text-red-600">You don't have permission to access this page</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Administration Panel</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'roles'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Role & Permission Management
        </button>
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddUser ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showAddUser && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Add New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newIsAdmin}
                        onChange={(e) => setNewIsAdmin(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Make Admin</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
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
                    <th
                      onClick={() => handleColumnSort('username')}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Username{renderSortIndicator('username')}
                    </th>
                    <th
                      onClick={() => handleColumnSort('email')}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Email{renderSortIndicator('email')}
                    </th>
                    <th
                      onClick={() => handleColumnSort('role')}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Role{renderSortIndicator('role')}
                    </th>
                    <th
                      onClick={() => handleColumnSort('admin')}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Admin{renderSortIndicator('admin')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getSortedUsers().map((u) => (
                    <React.Fragment key={u.id}>
                      <tr>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {editingUserId === u.id ? (
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          ) : (
                            u.username
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {editingUserId === u.id ? (
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            u.email
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            disabled={u.id === currentUser?.id}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                            disabled={u.id === currentUser?.id}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              u.isAdmin
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            } ${u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {u.isAdmin ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            {editingUserId === u.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveUserChanges(u)}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditingUser(u)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleResetPassword(u.email)}
                                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium transition-colors"
                                >
                                  Reset Pwd
                                </button>
                                {u.id !== currentUser?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Role & Permission Management Tab */}
      {activeTab === 'roles' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Role & Permission Management</h2>
          <div className="space-y-8">
            {ROLES.map((roleInfo) => (
              <RolePermissionMatrix
                key={roleInfo.value}
                role={roleInfo.value}
                roleLabel={roleInfo.label}
                permissions={rolePermissions[roleInfo.value]}
                isUnsaved={unsavedRoles.has(roleInfo.value)}
                onPermissionChange={(action, level) => {
                  setRolePermissions({
                    ...rolePermissions,
                    [roleInfo.value]: {
                      ...rolePermissions[roleInfo.value],
                      [action]: level,
                    },
                  });
                  setUnsavedRoles(new Set([...unsavedRoles, roleInfo.value]));
                }}
                onSave={() => {
                  handleSavePermissions(roleInfo.value, rolePermissions[roleInfo.value]);
                  setUnsavedRoles(new Set([...unsavedRoles].filter(r => r !== roleInfo.value)));
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RolePermissionMatrixProps {
  role: UserRole;
  roleLabel: string;
  permissions: Record<PermissionAction, PermissionLevel>;
  isUnsaved: boolean;
  onPermissionChange: (action: PermissionAction, level: PermissionLevel) => void;
  onSave: () => void;
}

function RolePermissionMatrix({ role, roleLabel, permissions, isUnsaved, onPermissionChange, onSave }: RolePermissionMatrixProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">{roleLabel}</h3>
        {isUnsaved && (
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Action</th>
              {PERMISSION_LEVELS.map((level) => (
                <th key={level} className="text-center py-2 px-2 font-semibold text-gray-700">
                  {LEVEL_LABELS[level]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_ACTIONS.map((action) => (
              <tr key={action} className="border-b border-gray-100">
                <td className="py-2 px-2 font-medium text-gray-700">{ACTION_LABELS[action]}</td>
                {PERMISSION_LEVELS.map((level) => (
                  <td key={`${action}-${level}`} className="text-center py-2 px-2">
                    <input
                      type="radio"
                      name={`${role}-${action}`}
                      value={level}
                      checked={permissions[action] === level}
                      onChange={() => onPermissionChange(action, level)}
                      className="h-4 w-4 text-blue-600 cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
