import { useState } from 'react';
import type { Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskDetail } from './TaskDetail';

interface TaskCardProps {
  task: Task;
  users?: User[];
  onReassign?: (taskId: string, userId: string) => void;
}

export function TaskCard({ task, users = [], onReassign }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const { user: currentUser } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const canReassign = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = new Date(task.deadline) < new Date();
  const daysUntilDue = Math.ceil(
    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`task-card cursor-move ${isDragging ? 'opacity-50' : ''} ${
          isOverdue ? 'border-l-red-500' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                #{task.priority}
              </span>
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            </div>

            <p className="text-gray-600 text-sm mb-3">{task.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Assigned to:</span>
                {canReassign && users.length > 0 ? (
                  <select
                    value={task.responsibleId || ''}
                    onChange={(e) => {
                      if (onReassign) {
                        onReassign(task.id, e.target.value);
                      }
                    }}
                    className="input-field text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-medium text-gray-900">{task.responsibleName || 'Unassigned'}</p>
                )}
              </div>
              {task.supportName && (
                <div>
                  <span className="text-gray-500">Support:</span>
                  <p className="font-medium text-gray-900">{task.supportName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                isOverdue
                  ? 'bg-red-100 text-red-700'
                  : daysUntilDue <= 3
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(task.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>

        {task.notes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Latest note:</p>
            <p className="text-sm text-gray-700 italic">
              "{task.notes[0]?.text.substring(0, 50)}..."
            </p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
          className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
        >
          View Details & Add Notes
        </button>
      </div>

      {showDetail && (
        <TaskDetail task={task} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
