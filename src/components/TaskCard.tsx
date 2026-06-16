import type { Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface TaskCardProps {
  task: Task;
  users?: User[];
  onReassign?: (taskId: string, userId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskCard({ task, users = [], onReassign, onTaskClick }: TaskCardProps) {
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

  const userColor = getUserColor(task.responsibleId, users);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`task-card ${isDragging ? 'opacity-50' : ''} ${
        isOverdue ? 'border-l-red-500' : ''
      }`}
    >
      {/* Drag handle - only this has drag listeners */}
      <div
        {...listeners}
        className={`cursor-move mb-3 p-3 rounded-t-lg ${userColor.bg} ${userColor.text} hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center gap-2">
          {/* Drag icon */}
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>

          <span className="bg-white bg-opacity-20 text-xs font-bold px-2 py-1 rounded">
            #{task.priority}
          </span>
          <h3 className="text-lg font-semibold flex-1">{task.title}</h3>
        </div>
      </div>

      {/* Non-draggable content */}
      <div className="space-y-3">
        <p className="text-gray-600 text-sm">{task.description}</p>

        <div className="flex items-start justify-between">
          <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
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
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Latest note:</p>
            <p className="text-sm text-gray-700 italic">
              "{task.notes[0]?.text.substring(0, 50)}..."
            </p>
          </div>
        )}

        <button
          onClick={() => onTaskClick?.(task)}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-3 rounded-lg transition-colors text-sm cursor-pointer"
        >
          View Details & Add Notes
        </button>
      </div>
    </div>
  );
}
