import { useState, useEffect } from 'react';
import type { Task, TaskNote, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

// Color palette for users
const userColors: { [key: string]: { bg: string; text: string } } = {
  0: { bg: 'bg-blue-500', text: 'text-white' },
  1: { bg: 'bg-green-500', text: 'text-white' },
  2: { bg: 'bg-purple-500', text: 'text-white' },
  3: { bg: 'bg-pink-500', text: 'text-white' },
  4: { bg: 'bg-indigo-500', text: 'text-white' },
  5: { bg: 'bg-cyan-500', text: 'text-white' },
  6: { bg: 'bg-amber-500', text: 'text-white' },
  7: { bg: 'bg-rose-500', text: 'text-white' },
};

function getUserColor(userId: string | undefined, users: User[]): { bg: string; text: string } {
  if (!userId) {
    return { bg: 'bg-gray-400', text: 'text-white' };
  }
  const userIndex = users.findIndex((u) => u.id === userId);
  const colorIndex = userIndex >= 0 ? userIndex % Object.keys(userColors).length : 0;
  return userColors[colorIndex];
}

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDetail({ task, onClose, onTaskUpdated }: TaskDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<TaskNote[]>(task.notes || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
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

  useEffect(() => {
    // Listen for real-time updates to notes
    const notesQuery = query(
      collection(db, 'tasks', task.id, 'notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const notesData: TaskNote[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        addedBy: doc.data().addedBy,
        addedByName: doc.data().addedByName,
        createdAt: doc.data().createdAt.toDate(),
      }));
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, [task.id]);

  async function handleAddNote() {
    if (!newNote.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks', task.id, 'notes'), {
        text: newNote,
        addedBy: user.id,
        addedByName: user.username,
        createdAt: serverTimestamp(),
      });
      setNewNote('');
    } catch (error: any) {
      console.error('Failed to add note:', error);
      alert(`Failed to add note: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        title: editTitle,
        description: editDescription,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'tasks', task.id, 'notes', noteId));
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      alert(`Failed to delete note: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote(noteId: string) {
    if (!editingNoteText.trim()) return;
    setLoading(true);
    try {
      const noteToUpdate = notes.find(n => n.id === noteId);
      if (!noteToUpdate) return;

      // Delete old note and create new one
      await deleteDoc(doc(db, 'tasks', task.id, 'notes', noteId));
      await addDoc(collection(db, 'tasks', task.id, 'notes'), {
        text: editingNoteText,
        addedBy: noteToUpdate.addedBy,
        addedByName: noteToUpdate.addedByName,
        createdAt: noteToUpdate.createdAt,
      });

      setEditingNoteId(null);
      setEditingNoteText('');
    } catch (error: any) {
      console.error('Failed to save note:', error);
      alert(`Failed to save note: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const userColor = getUserColor(task.responsibleId, users);

  return (
    <div className="fixed inset-0 bg-blue-100 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-300">
        {/* Colored Header Banner */}
        <div className={`${userColor.bg} ${userColor.text} px-6 py-5 rounded-t-xl border-b-4 border-gray-300`}>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field text-3xl font-bold flex-1 bg-white bg-opacity-30 text-gray-900 placeholder-gray-700"
              disabled={loading}
            />
          ) : (
            <h2 className="text-3xl font-bold">{task.title}</h2>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-6 py-3 flex justify-end gap-2">
          {isEditing ? (
            <>
              <button
                onClick={async () => {
                  await handleSaveEdit();
                  onTaskUpdated?.();
                  onClose();
                }}
                className="btn-primary text-sm"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save and Close'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(task.title);
                  setEditDescription(task.description);
                }}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onTaskUpdated?.();
                  onClose();
                }}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Description */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                disabled={loading}
              />
            ) : (
              <p className="text-gray-700">{task.description}</p>
            )}
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Assigned To</h4>
              <p className="text-gray-700">{task.responsibleName || 'Unassigned'}</p>
            </div>
            {task.supportName && (
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Support</h4>
                <p className="text-gray-700">{task.supportName}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Due Date</h4>
              <p className="text-gray-700">{new Date(task.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Priority</h4>
              <p className="text-gray-700">#{task.priority}</p>
            </div>
          </div>

          {/* Interim Deadlines */}
          {task.interimDeadlines.length > 0 && (
            <div className="pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Interim Deadlines</h3>
              <div className="space-y-2">
                {task.interimDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="bg-blue-50 border-l-2 border-blue-500 p-3 rounded"
                  >
                    <p className="font-medium text-gray-900">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700">{deadline.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>

            {/* Add Note */}
            {(user?.role === 'admin' || user?.role === 'manager' ||
              user?.id === task.responsibleId) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={loading}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || loading}
                  className="btn-primary mt-2 text-sm"
                >
                  {loading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            )}

            {/* Existing Notes */}
            <div className="space-y-3">
              {sortedNotes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes yet</p>
              ) : (
                sortedNotes.map((note) => {
                  const canEditNote =
                    user?.id === note.addedBy || user?.role === 'admin' || user?.role === 'manager';

                  return (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {note.addedByName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {canEditNote && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteText(note.text);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={loading}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {editingNoteId === note.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={3}
                            disabled={loading}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveNote(note.id)}
                              disabled={!editingNoteText.trim() || loading}
                              className="btn-primary text-xs"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteText('');
                              }}
                              className="btn-secondary text-xs"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{note.text}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
