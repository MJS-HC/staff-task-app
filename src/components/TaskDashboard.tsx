import { useState, useEffect } from 'react';
import type { Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskDetail } from './TaskDetail';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  collection,
  query,
  onSnapshot,
  writeBatch,
  doc,
  getDocs,
} from 'firebase/firestore';

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 } as any),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadUsers();
    loadTasks();
  }, []);

  // Keep selectedTask in sync with tasks array
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  async function loadUsers() {
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
      console.error('Failed to load users:', error);
    }
  }

  function loadTasks() {
    setLoading(true);
    try {
      const tasksQuery = query(collection(db, 'tasks'));

      const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
        const tasksData: Task[] = [];

        for (const taskDoc of snapshot.docs) {
          const taskData = taskDoc.data();

          // Load user names for display
          let responsibleName = 'Unassigned';
          let supportName: string | undefined;
          let allocatedByName = 'Unknown';

          if (taskData.responsibleId) {
            try {
              const userSnap = await getDocs(
                query(collection(db, 'users'))
              );
              const responsibleUser = userSnap.docs.find(
                (u) => u.id === taskData.responsibleId
              );
              if (responsibleUser) {
                responsibleName = responsibleUser.data().username;
              }
            } catch (error) {
              console.error('Failed to load responsible user:', error);
            }
          }

          if (taskData.supportId) {
            try {
              const userSnap = await getDocs(
                query(collection(db, 'users'))
              );
              const supportUser = userSnap.docs.find(
                (u) => u.id === taskData.supportId
              );
              if (supportUser) {
                supportName = supportUser.data().username;
              }
            } catch (error) {
              console.error('Failed to load support user:', error);
            }
          }

          try {
            const userSnap = await getDocs(query(collection(db, 'users')));
            const allocatedByUser = userSnap.docs.find(
              (u) => u.id === taskData.allocatedById
            );
            if (allocatedByUser) {
              allocatedByName = allocatedByUser.data().username;
            }
          } catch (error) {
            console.error('Failed to load allocated by user:', error);
          }

          // Load notes from subcollection
          let notesData: any[] = [];
          try {
            const notesSnapshot = await getDocs(
              collection(db, 'tasks', taskDoc.id, 'notes')
            );
            notesData = notesSnapshot.docs.map((noteDoc) => ({
              id: noteDoc.id,
              text: noteDoc.data().text,
              addedBy: noteDoc.data().addedBy,
              addedByName: noteDoc.data().addedByName,
              createdAt: noteDoc.data().createdAt.toDate(),
            }));
          } catch (error) {
            console.error('Failed to load notes:', error);
          }

          tasksData.push({
            id: taskDoc.id,
            title: taskData.title,
            description: taskData.description,
            responsibleId: taskData.responsibleId,
            responsibleName,
            supportId: taskData.supportId,
            supportName,
            allocatedById: taskData.allocatedById,
            allocatedByName,
            deadline: taskData.deadline.toDate(),
            priority: taskData.priority,
            createdAt: taskData.createdAt.toDate(),
            updatedAt: taskData.updatedAt.toDate(),
            interimDeadlines: taskData.interimDeadlines || [],
            notes: notesData,
          });
        }

        setTasks(tasksData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setLoading(false);
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Find the dragged task
      const draggedTask = tasks.find((t) => t.id === active.id);
      const overTask = tasks.find((t) => t.id === over.id);

      if (!draggedTask || !overTask) return;

      // Get all tasks for the responsible user (sorted by priority)
      const userTasks = tasks
        .filter(
          (t) =>
            t.responsibleId === draggedTask.responsibleId ||
            t.responsibleId === overTask.responsibleId
        )
        .sort((a, b) => a.priority - b.priority);

      // Reorder within user
      const oldIndex = userTasks.findIndex((t) => t.id === active.id);
      const newIndex = userTasks.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedUserTasks = arrayMove([...userTasks], oldIndex, newIndex);

      // Update priorities for this user's tasks
      const updatedTasks = reorderedUserTasks.map((task, idx) => ({
        ...task,
        priority: idx + 1,
      }));

      // Update the full tasks array
      const newTasks = tasks.map(
        (t) => updatedTasks.find((ut) => ut.id === t.id) || t
      );
      setTasks(newTasks);

      // Save to Firestore
      try {
        const batch = writeBatch(db);
        updatedTasks.forEach((task) => {
          batch.update(doc(db, 'tasks', task.id), {
            priority: task.priority,
          });
        });
        await batch.commit();
      } catch (error) {
        console.error('Failed to save priority updates:', error);
      }
    }
  }

  const canCreateTask = user?.isAdmin || ['nursery-manager', 'deputy-manager'].includes(user?.role || '');

  async function handleTaskReassign(taskId: string, newUserId: string) {
    try {
      const taskToMove = tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const oldUserId = taskToMove.responsibleId;
      const batch = writeBatch(db);

      // If moving from one user to another, renumber the original user's tasks
      if (oldUserId) {
        const oldUserTasks = tasks
          .filter((t) => t.responsibleId === oldUserId && t.id !== taskId)
          .sort((a, b) => a.priority - b.priority);

        // Renumber old user's remaining tasks
        oldUserTasks.forEach((task, idx) => {
          batch.update(doc(db, 'tasks', task.id), {
            priority: idx + 1,
          });
        });
      }

      // Get all tasks for the new user and renumber
      const newUserTasks = tasks
        .filter((t) => t.responsibleId === newUserId)
        .sort((a, b) => a.priority - b.priority);

      // Renumber new user's existing tasks (just in case)
      newUserTasks.forEach((task, idx) => {
        batch.update(doc(db, 'tasks', task.id), {
          priority: idx + 1,
        });
      });

      // Move the task to new user with new priority (at the end)
      batch.update(doc(db, 'tasks', taskId), {
        responsibleId: newUserId || null,
        priority: newUserTasks.length + 1,
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to reassign task:', error);
    }
  }

  // Group tasks by user with sorting
  const userColumns = users.map((u) => ({
    user: u,
    tasks: tasks
      .filter((t) => t.responsibleId === u.id)
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return a.priority - b.priority;
        } else {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
      }),
  }));

  // Add unassigned column
  const unassignedTasks = tasks
    .filter((t) => !t.responsibleId)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return a.priority - b.priority;
      } else {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
    });

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Task Dashboard</h1>
        {canCreateTask && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {showForm && canCreateTask && (
        <div className="mb-8 bg-white rounded-lg p-6">
          <TaskForm onClose={() => setShowForm(false)} onTaskCreated={loadTasks} />
        </div>
      )}

      {/* Sort Options */}
      <div className="mb-6 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={sortBy === 'priority'}
            onChange={() => setSortBy('priority')}
            className="rounded"
          />
          <span className="text-gray-700">Sort by Priority</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={sortBy === 'date'}
            onChange={() => setSortBy('date')}
            className="rounded"
          />
          <span className="text-gray-700">Sort by Due Date</span>
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Unassigned column - only visible to admin/manager */}
          {canCreateTask && (
            <div className="bg-white rounded-lg p-4 sticky top-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-300">
                Unassigned ({unassignedTasks.length})
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={unassignedTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {unassignedTasks.length === 0 ? (
                      <p className="text-gray-400 text-sm">No unassigned tasks</p>
                    ) : (
                      unassignedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          users={users}
                          onReassign={canCreateTask ? handleTaskReassign : undefined}
                          onTaskClick={setSelectedTask}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* User columns - show based on role */}
          {userColumns
            .filter(({ user: u }) => {
              // EYE/Office managers only see their own column
              if (user?.role === 'eye' || user?.role === 'office-manager') {
                return u.id === user.id;
              }
              // Others see all
              return true;
            })
            .map(({ user: u, tasks: userTasks }) => (
              <div key={u.id} className="bg-white rounded-lg p-4 sticky top-6 h-fit">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {u.username}
                </h2>
                <p className="text-xs text-gray-500 mb-4 pb-3 border-b-2 border-gray-200">
                  {u.role} • {userTasks.length} task{userTasks.length !== 1 ? 's' : ''}
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={userTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {userTasks.length === 0 ? (
                        <p className="text-gray-400 text-sm">No tasks assigned</p>
                      ) : (
                        userTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            users={users}
                            onReassign={canCreateTask ? handleTaskReassign : undefined}
                            onTaskClick={setSelectedTask}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={loadTasks}
        />
      )}
    </div>
  );
}
