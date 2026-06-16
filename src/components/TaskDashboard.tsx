import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
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
  orderBy,
  writeBatch,
  doc,
  getDocs,
} from 'firebase/firestore';

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 } as any),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadTasks();
  }, []);

  function loadTasks() {
    setLoading(true);
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        orderBy('priority', 'asc')
      );

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
            notes: (taskData.notes || []).map((note: any) => ({
              ...note,
              createdAt: note.createdAt.toDate(),
            })),
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
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove([...tasks], oldIndex, newIndex);

      newTasks.forEach((task, index) => {
        task.priority = index + 1;
      });

      setTasks(newTasks);

      // Save updated priorities to Firestore
      try {
        const batch = writeBatch(db);
        newTasks.forEach((task) => {
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

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return a.priority - b.priority;
    } else {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
  });

  const canCreateTask = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
        <div className="mb-8">
          <TaskForm onClose={() => setShowForm(false)} onTaskCreated={loadTasks} />
        </div>
      )}

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
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No tasks yet</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
