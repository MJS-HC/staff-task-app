import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import type { User } from '../types';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface TaskFormProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

export function TaskForm({ onClose, onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [supportId, setSupportId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get the highest priority for this user
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const userTasks = tasksSnapshot.docs
        .filter((doc) => doc.data().responsibleId === responsibleId)
        .map((doc) => doc.data().priority || 0);
      const maxUserPriority = Math.max(0, ...userTasks);

      const taskRef = await addDoc(collection(db, 'tasks'), {
        title,
        description,
        responsibleId: responsibleId || null,
        supportId: supportId || null,
        allocatedById: user.id,
        deadline: new Date(deadline),
        priority: maxUserPriority + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        interimDeadlines: [],
        notes: [],
      });

      // Add initial note if provided
      if (initialNote.trim()) {
        await addDoc(collection(db, 'tasks', taskRef.id, 'notes'), {
          text: initialNote,
          addedBy: user.id,
          addedByName: user.username,
          createdAt: serverTimestamp(),
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setResponsibleId('');
      setSupportId('');
      setDeadline('');
      setInitialNote('');

      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" autoComplete="off">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Create New Task</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To (Optional)
            </label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Person (Optional)
            </label>
            <select
              value={supportId}
              onChange={(e) => setSupportId(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">None</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Note (Optional)</label>
          <textarea
            value={initialNote}
            onChange={(e) => setInitialNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Add an initial note to this task"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !title || !deadline}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
