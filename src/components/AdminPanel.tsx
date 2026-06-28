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
import { createUserWithEmailAndPassword } from 'firebase/auth';

const ROLES: { value: UserRole; label: string; grade: number }[] = [
  { value: 'eye', label: 'EYE (Early Years Educator)', grade: 1 },
  { value: 'office-manager', label: 'Office Manager', grade: 2 },
  { value: 'senior-staff', label: 'Senior Staff', grade: 3 },
  { value: 'deputy-manager', label: 'Deputy Manager', grade: 4 },
  { value: 'nursery-manager', label: 'Nursery Manager', grade: 5 },
];

const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'add', 'edit', 'prioritise', 'move'];
const PERMISSION_LEVELS: PermissionLevel[] = ['self', 'below', 'own-and-below', 'all'];

const DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionAction, PermissionLevel>> = {
  'eye': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
  'office-manager': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
  'senior-staff': { view: 'own-and-below', add: 'self', edit: 'own-and-below', prioritise: 'own-and-below', move: 'self' },
  'deputy-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'nursery-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'admin': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'carer': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
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
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      loadData();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    try {
      await updateDoc(doc(db, 'users', userId), { isAdmin: !isAdmin });
      loadData();
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
    }
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admin</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
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
                      <td className="px-6 py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
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
                onSave={handleSavePermissions}
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
  onSave: (role: UserRole, permissions: Record<PermissionAction, PermissionLevel>) => void;
}

function RolePermissionMatrix({ role, roleLabel, onSave }: RolePermissionMatrixProps) {
  const [permissions, setPermissions] = useState<Record<PermissionAction, PermissionLevel>>(
    DEFAULT_PERMISSIONS[role]
  );
  const [isSaved, setIsSaved] = useState(true);

  const handlePermissionChange = (action: PermissionAction, level: PermissionLevel) => {
    setPermissions({ ...permissions, [action]: level });
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(role, permissions);
    setIsSaved(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">{roleLabel}</h3>
        {!isSaved && (
          <button
            onClick={handleSave}
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
                  {level === 'self' ? 'Self' : level === 'below' ? 'All Below' : level === 'own-and-below' ? 'Own & Below' : 'All'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_ACTIONS.map((action) => (
              <tr key={action} className="border-b border-gray-100">
                <td className="py-2 px-2 font-medium text-gray-700 capitalize">{action}</td>
                {PERMISSION_LEVELS.map((level) => (
                  <td key={`${action}-${level}`} className="text-center py-2 px-2">
                    <input
                      type="radio"
                      name={action}
                      value={level}
                      checked={permissions[action] === level}
                      onChange={() => handlePermissionChange(action, level)}
                      className="h-4 w-4 text-blue-600"
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
