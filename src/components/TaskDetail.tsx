import { useState } from 'react';
import type { Task } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function handleAddNote() {
    if (!newNote.trim() || !user) return;

    setLoading(true);
    try {
      // TODO: Add note to Firestore
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
    setLoading(false);
  }

  const sortedNotes = [...task.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{task.description}</p>
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
