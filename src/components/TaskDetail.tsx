import { useState, useEffect } from 'react';
import type { Task, TaskNote } from '../types';
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
} from 'firebase/firestore';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<TaskNote[]>(task.notes || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const { user } = useAuth();

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
    } catch (error) {
      console.error('Failed to add note:', error);
    }
    setLoading(false);
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
    }
    setLoading(false);
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field text-2xl font-bold flex-1"
              disabled={loading}
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          )}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary text-sm"
                  disabled={loading}
                >
                  Save
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
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
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
                sortedNotes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {note.addedByName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-700">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
