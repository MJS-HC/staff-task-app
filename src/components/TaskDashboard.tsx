import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { useAuth } from '../context/AuthContext';
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

  async function loadTasks() {
    setLoading(true);
    try {
      // TODO: Load tasks from Firestore
      setTasks([]);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    setLoading(false);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove([...tasks], oldIndex, newIndex);

      newTasks.forEach((task, index) => {
        task.priority = index + 1;
      });

      setTasks(newTasks);
      // TODO: Save updated priorities to Firestore
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
