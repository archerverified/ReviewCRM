'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ContactSearchInput } from '@/components/ContactSearchInput';
import { taskQueries, taskChecklistQueries, taskCommentQueries, businessQueries, campaignQueries } from '@/lib/supabase';
import type { Task, TaskChecklist, TaskComment, Business, Campaign } from '@/types';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/types';
import type { TaskStatus, TaskPriority } from '@/types';
import { toast } from 'sonner';

type ViewMode = 'list' | 'board' | 'calendar';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tasksData, contactsData, campaignsData] = await Promise.all([
        taskQueries.getAll(),
        businessQueries.getAll(),
        campaignQueries.getAll(),
      ]);
      setTasks(tasksData);
      setContacts(contactsData);
      setCampaigns(campaignsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load tasks: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  // Quick stats
  const today = new Date().toISOString().split('T')[0];
  const completedToday = tasks.filter(t =>
    t.completed_at &&
    t.completed_at.split('T')[0] === today
  ).length;

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const upcomingThisWeek = tasks.filter(t =>
    t.due_date &&
    t.due_date >= today &&
    t.due_date <= weekEndStr &&
    t.status !== 'done'
  ).length;

  // Group tasks for list view
  const overdueTasks = filteredTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done');
  const todayTasks = filteredTasks.filter(t => t.due_date === today && t.status !== 'done');
  const thisWeekTasks = filteredTasks.filter(t => t.due_date && t.due_date > today && t.due_date <= weekEndStr && t.status !== 'done');
  const laterTasks = filteredTasks.filter(t => (!t.due_date || t.due_date > weekEndStr) && t.status !== 'done');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  // Group tasks for board view
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    try {
      await taskQueries.updateStatus(taskId, newStatus);
      setTasks(tasks.map(t => t.id === taskId ? {
        ...t,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      } : t));

      if (selectedTask?.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        });
      }

      toast.success(`Task moved to ${TASK_STATUS_CONFIG[newStatus].label}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update task: ${errorMessage}`);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await taskQueries.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete task: ${errorMessage}`);
    }
  }

  function getContactName(contactId: string | null): string {
    if (!contactId) return '';
    const contact = contacts.find(c => c.id === contactId);
    return contact?.business_name || '';
  }

  function getCampaignName(campaignId: string | null): string {
    if (!campaignId) return '';
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || '';
  }

  function handleClearFilters() {
    setFilterStatus('all');
    setFilterPriority('all');
  }

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          </div>
          <p className="text-gray-500 mt-1.5 ml-13">
            {filteredTasks.length} tasks
            {overdueTasks.length > 0 && (
              <span className="text-red-500 font-medium"> • {overdueTasks.length} overdue</span>
            )}
            <span className="text-gray-400"> • </span>
            <span className="text-green-600 font-medium">{completedToday} completed today</span>
            {upcomingThisWeek > 0 && (
              <>
                <span className="text-gray-400"> • </span>
                <span className="text-blue-600 font-medium">{upcomingThisWeek} upcoming this week</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Enhanced View Toggle with Tooltips */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`group relative px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="List View - organized by due date"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
              {/* Tooltip */}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Organize by due date
              </span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`group relative px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-300 border-l border-r border-gray-200 ${
                viewMode === 'board'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Board View - Kanban style"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Board
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Kanban board
              </span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`group relative px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                viewMode === 'calendar'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Calendar View"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                View by date
              </span>
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className={`pl-9 pr-3 py-2 rounded-lg border text-sm bg-white transition-all duration-300 ${
              filterStatus !== 'all'
                ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="all">All Status</option>
            {TASK_STATUSES.map(status => (
              <option key={status} value={status}>
                {TASK_STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className={`pl-9 pr-3 py-2 rounded-lg border text-sm bg-white transition-all duration-300 ${
              filterPriority !== 'all'
                ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="all">All Priority</option>
            {TASK_PRIORITIES.map(priority => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_CONFIG[priority].label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 animate-in fade-in slide-in-from-left-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
      </div>

      {/* View Content with Animation */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {overdueTasks.length > 0 && (
              <TaskGroup
                title="Overdue"
                count={overdueTasks.length}
                tasks={overdueTasks}
                variant="danger"
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                getContactName={getContactName}
                getCampaignName={getCampaignName}
              />
            )}
            {todayTasks.length > 0 && (
              <TaskGroup
                title="Due Today"
                count={todayTasks.length}
                tasks={todayTasks}
                variant="warning"
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                getContactName={getContactName}
                getCampaignName={getCampaignName}
              />
            )}
            {thisWeekTasks.length > 0 && (
              <TaskGroup
                title="This Week"
                count={thisWeekTasks.length}
                tasks={thisWeekTasks}
                variant="default"
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                getContactName={getContactName}
                getCampaignName={getCampaignName}
              />
            )}
            {laterTasks.length > 0 && (
              <TaskGroup
                title="Later / No Due Date"
                count={laterTasks.length}
                tasks={laterTasks}
                variant="muted"
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                getContactName={getContactName}
                getCampaignName={getCampaignName}
              />
            )}
            {completedTasks.length > 0 && (
              <TaskGroup
                title="Completed"
                count={completedTasks.length}
                tasks={completedTasks}
                variant="success"
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                getContactName={getContactName}
                getCampaignName={getCampaignName}
                collapsed
              />
            )}

            {filteredTasks.length === 0 && (
              <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Get started by creating your first task to track your work.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Task
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Board View */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-3 gap-6">
            <TaskColumn
              title="To Do"
              count={todoTasks.length}
              tasks={todoTasks}
              status="todo"
              onTaskClick={setSelectedTask}
              onStatusChange={handleStatusChange}
              getContactName={getContactName}
              getCampaignName={getCampaignName}
              onAddTask={() => {
                setNewTaskStatus('todo');
                setShowCreateModal(true);
              }}
            />
            <TaskColumn
              title="In Progress"
              count={inProgressTasks.length}
              tasks={inProgressTasks}
              status="in_progress"
              onTaskClick={setSelectedTask}
              onStatusChange={handleStatusChange}
              getContactName={getContactName}
              getCampaignName={getCampaignName}
              onAddTask={() => {
                setNewTaskStatus('in_progress');
                setShowCreateModal(true);
              }}
            />
            <TaskColumn
              title="Done"
              count={doneTasks.length}
              tasks={doneTasks}
              status="done"
              onTaskClick={setSelectedTask}
              onStatusChange={handleStatusChange}
              getContactName={getContactName}
              getCampaignName={getCampaignName}
              onAddTask={() => {
                setNewTaskStatus('done');
                setShowCreateModal(true);
              }}
            />
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <CalendarView
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onAddTask={(date) => {
              setShowCreateModal(true);
            }}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewTaskStatus(null);
        }}
        contacts={contacts}
        campaigns={campaigns}
        defaultStatus={newTaskStatus}
        onTaskCreated={(task) => {
          setTasks([task, ...tasks]);
          setShowCreateModal(false);
          setNewTaskStatus(null);
        }}
      />

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          contacts={contacts}
          campaigns={campaigns}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updates) => {
            const updated = await taskQueries.update(selectedTask.id, updates);
            setTasks(tasks.map(t => t.id === selectedTask.id ? updated : t));
            setSelectedTask(updated);
            toast.success('Task updated');
          }}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          onStatusChange={(status) => handleStatusChange(selectedTask.id, status)}
        />
      )}
    </div>
  );
}

// Enhanced Task Group Component (List View)
function TaskGroup({
  title,
  count,
  tasks,
  variant,
  onTaskClick,
  onStatusChange,
  getContactName,
  getCampaignName,
  collapsed = false,
}: {
  title: string;
  count: number;
  tasks: Task[];
  variant: 'danger' | 'warning' | 'default' | 'muted' | 'success';
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  getContactName: (id: string | null) => string;
  getCampaignName: (id: string | null) => string;
  collapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const variantConfig = {
    danger: {
      bg: 'bg-gradient-to-r from-red-100 to-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      countBg: 'bg-red-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-gradient-to-r from-orange-100 to-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      countBg: 'bg-orange-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
    },
    default: {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      countBg: 'bg-blue-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
    },
    muted: {
      bg: 'bg-gradient-to-r from-gray-100 to-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      countBg: 'bg-gray-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-gradient-to-r from-green-100 to-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      countBg: 'bg-green-200',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = variantConfig[variant];

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${config.bg} border ${config.border} mb-3 transition-all duration-300 hover:shadow-md`}
      >
        <div className="flex items-center gap-2">
          <span className={config.text}>{config.icon}</span>
          <span className={`font-semibold ${config.text}`}>{title}</span>
          <span className={`text-xs font-medium ${config.text} ${config.countBg} px-2 py-0.5 rounded-full transition-all duration-300`}>
            {count}
          </span>
        </div>
        <svg
          className={`w-5 h-5 ${config.text} transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="space-y-3 pl-2 animate-in slide-in-from-top-2 fade-in duration-300">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onStatusChange={onStatusChange}
              getContactName={getContactName}
              getCampaignName={getCampaignName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced Task Column Component (Board View)
function TaskColumn({
  title,
  count,
  tasks,
  status,
  onTaskClick,
  onStatusChange,
  getContactName,
  getCampaignName,
  onAddTask,
}: {
  title: string;
  count: number;
  tasks: Task[];
  status: TaskStatus;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  getContactName: (id: string | null) => string;
  getCampaignName: (id: string | null) => string;
  onAddTask: () => void;
}) {
  const columnConfig = {
    todo: {
      gradient: 'from-gray-100 to-gray-50',
      border: 'border-gray-200',
      headerBg: 'bg-gray-100',
      headerText: 'text-gray-700',
      countBg: 'bg-gray-200',
      addButtonBg: 'hover:bg-gray-100',
      addButtonText: 'text-gray-600',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    in_progress: {
      gradient: 'from-blue-100 to-blue-50',
      border: 'border-blue-200',
      headerBg: 'bg-blue-100',
      headerText: 'text-blue-700',
      countBg: 'bg-blue-200',
      addButtonBg: 'hover:bg-blue-100',
      addButtonText: 'text-blue-600',
      icon: (
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    done: {
      gradient: 'from-green-100 to-green-50',
      border: 'border-green-200',
      headerBg: 'bg-green-100',
      headerText: 'text-green-700',
      countBg: 'bg-green-200',
      addButtonBg: 'hover:bg-green-100',
      addButtonText: 'text-green-600',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  };

  const config = columnConfig[status];

  return (
    <div className={`bg-gradient-to-b ${config.gradient} rounded-xl border-2 ${config.border} overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md flex flex-col`}>
      <div className={`flex items-center justify-between px-4 py-3 ${config.headerBg} border-b ${config.border}`}>
        <div className="flex items-center gap-2">
          <span className={config.headerText}>{config.icon}</span>
          <h3 className={`font-semibold ${config.headerText}`}>{title}</h3>
        </div>
        <span className={`text-xs font-bold ${config.headerText} ${config.countBg} px-2.5 py-1 rounded-full transition-all duration-300 transform hover:scale-110`}>
          {count}
        </span>
      </div>
      <div className="p-3 space-y-3 min-h-[400px] flex-1">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onStatusChange={onStatusChange}
            getContactName={getContactName}
            getCampaignName={getCampaignName}
            compact
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-2 bg-white/60 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No tasks yet</p>
          </div>
        )}
      </div>
      {/* Add Task Button at Bottom */}
      <div className="p-3 border-t border-gray-200/50">
        <button
          onClick={onAddTask}
          className={`w-full py-2.5 rounded-lg ${config.addButtonBg} ${config.addButtonText} flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 hover:shadow-sm group`}
        >
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>
    </div>
  );
}

// Enhanced Task Card Component
function TaskCard({
  task,
  onClick,
  onStatusChange,
  getContactName,
  getCampaignName,
  compact = false,
}: {
  task: Task;
  onClick: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  getContactName: (id: string | null) => string;
  getCampaignName: (id: string | null) => string;
  compact?: boolean;
}) {
  const contactName = getContactName(task.contact_id);
  const campaignName = getCampaignName(task.campaign_id);
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'done';

  // Placeholder for checklist progress (would need to load actual data)
  const hasChecklist = false;
  const checklistProgress = 0;

  // Get user initials placeholder
  const getUserInitials = () => 'JD';

  return (
    <div
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-300 group ${
        task.status === 'done'
          ? 'opacity-60 border-gray-200 hover:border-gray-300'
          : isOverdue
          ? 'border-red-200 hover:border-red-300 hover:shadow-lg hover:-translate-y-0.5'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 mt-1 cursor-grab active:cursor-grabbing">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done');
          }}
          className="mt-0.5 h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-transform hover:scale-110"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className={`font-medium text-gray-900 group-hover:text-blue-600 transition-colors ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </div>
            {/* User Avatar/Initials */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {getUserInitials()}
            </div>
          </div>

          {!compact && task.description && (
            <div className="text-sm text-gray-500 mt-1.5 line-clamp-2">{task.description}</div>
          )}

          {/* Progress Indicator for Checklist */}
          {hasChecklist && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-xs text-gray-500">{checklistProgress}% complete</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                isOverdue
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium border transition-all hover:shadow-sm"
              style={{
                backgroundColor: `${priorityConfig.color}15`,
                color: priorityConfig.color,
                borderColor: `${priorityConfig.color}40`,
              }}
            >
              {task.priority === 'urgent' && (
                <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {priorityConfig.label}
            </span>
            {contactName && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 font-medium hover:bg-purple-200 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {contactName}
              </span>
            )}
            {campaignName && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 font-medium hover:bg-blue-200 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {campaignName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Label colors
const TASK_LABELS = [
  { id: 'bug', name: 'Bug', color: '#ef4444' },
  { id: 'feature', name: 'Feature', color: '#8b5cf6' },
  { id: 'improvement', name: 'Improvement', color: '#3b82f6' },
  { id: 'urgent', name: 'Urgent', color: '#f97316' },
  { id: 'review', name: 'Review', color: '#10b981' },
  { id: 'documentation', name: 'Docs', color: '#6b7280' },
];

// Task Templates
const TASK_TEMPLATES = [
  { name: 'Follow up with lead', description: 'Follow up with contact via email or call', priority: 'high' as TaskPriority },
  { name: 'Send proposal', description: 'Prepare and send project proposal', priority: 'high' as TaskPriority },
  { name: 'Review response', description: 'Write response to negative review', priority: 'medium' as TaskPriority },
  { name: 'Schedule meeting', description: 'Set up discovery call with prospect', priority: 'medium' as TaskPriority },
  { name: 'Update CRM', description: 'Update contact information and notes', priority: 'low' as TaskPriority },
];

// Enhanced Create Task Modal
function CreateTaskModal({
  isOpen,
  onClose,
  contacts,
  campaigns,
  defaultStatus = null,
  onTaskCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  contacts: Business[];
  campaigns: Campaign[];
  defaultStatus?: TaskStatus | null;
  onTaskCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [assignee, setAssignee] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('weekly');
  const [showTemplates, setShowTemplates] = useState(false);

  function applyTemplate(template: typeof TASK_TEMPLATES[0]) {
    setTitle(template.name);
    setDescription(template.description);
    setPriority(template.priority);
    setShowTemplates(false);
  }

  function toggleLabel(labelId: string) {
    if (selectedLabels.includes(labelId)) {
      setSelectedLabels(selectedLabels.filter(l => l !== labelId));
    } else {
      setSelectedLabels([...selectedLabels, labelId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const task = await taskQueries.create({
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        contact_id: contactId || null,
        campaign_id: campaignId || null,
        status: defaultStatus || 'todo',
      });

      onTaskCreated(task);
      toast.success('Task created');

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setContactId('');
      setCampaignId('');
      setSelectedLabels([]);
      setAssignee('');
      setIsRecurring(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create task: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Templates */}
        <div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Use Template
            <svg className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTemplates && (
            <div className="mt-2 grid grid-cols-1 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {TASK_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {template.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Labels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
          <div className="flex flex-wrap gap-2">
            {TASK_LABELS.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedLabels.includes(label.id)
                    ? 'ring-2 ring-offset-1 scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                  '--tw-ring-color': label.color,
                } as React.CSSProperties}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TASK_PRIORITIES.map(p => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_CONFIG[p].label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Unassigned</option>
            <option value="me">Assign to me</option>
            <option value="team-placeholder" disabled>— Team members coming soon —</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ContactSearchInput
            label="Contact"
            value={contactId}
            onChange={(id) => setContactId(id)}
            placeholder="Search by name, email, business, city..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recurring Task */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Recurring Task</span>
              <p className="text-xs text-gray-500">Automatically recreate this task on a schedule</p>
            </div>
          </label>
          {isRecurring && (
            <div className="mt-3 ml-7">
              <select
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* File Attachments Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-600">Drag & drop files</span> or click to attach
          </p>
          <p className="text-xs text-gray-400 mt-1">File attachments coming soon</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Enhanced Task Detail Panel
function TaskDetailPanel({
  task,
  contacts,
  campaigns,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  contacts: Business[];
  campaigns: Campaign[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  async function loadTaskDetails() {
    try {
      const [checklistData, commentData] = await Promise.all([
        taskChecklistQueries.getByTask(task.id),
        taskCommentQueries.getByTask(task.id),
      ]);
      setChecklists(checklistData);
      setComments(commentData);
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  }

  async function handleAddChecklistItem() {
    if (!newChecklistItem.trim()) return;
    try {
      const item = await taskChecklistQueries.create({
        task_id: task.id,
        title: newChecklistItem,
        sort_order: checklists.length,
      });
      setChecklists([...checklists, item]);
      setNewChecklistItem('');
    } catch (error) {
      toast.error('Failed to add checklist item');
    }
  }

  async function handleToggleChecklist(id: string) {
    try {
      await taskChecklistQueries.toggleComplete(id);
      setChecklists(checklists.map(c =>
        c.id === id ? { ...c, is_completed: !c.is_completed } : c
      ));
    } catch (error) {
      toast.error('Failed to toggle checklist item');
    }
  }

  async function handleDeleteChecklist(id: string) {
    try {
      await taskChecklistQueries.delete(id);
      setChecklists(checklists.filter(c => c.id !== id));
    } catch (error) {
      toast.error('Failed to delete checklist item');
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    try {
      const comment = await taskCommentQueries.create({
        task_id: task.id,
        content: newComment,
        author: 'User',
      });
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  }

  async function handleSaveEdit() {
    await onUpdate({ title: editTitle, description: editDescription || null });
    setIsEditing(false);
  }

  const contact = contacts.find(c => c.id === task.contact_id);
  const campaign = campaigns.find(c => c.id === task.campaign_id);
  const completedChecklists = checklists.filter(c => c.is_completed).length;
  const checklistProgress = checklists.length > 0 ? Math.round((completedChecklists / checklists.length) * 100) : 0;
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  // Placeholder activity timeline
  const activities = [
    { type: 'created', text: 'Task created', time: task.created_at },
    ...(task.completed_at ? [{ type: 'completed', text: 'Task completed', time: task.completed_at }] : []),
  ];

  return (
    <>
      {/* Overlay with smooth fade */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Center Modal - 700px wide, 80vh height */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[700px] bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300" style={{ maxHeight: '80vh' }}>
          <div className="h-full overflow-y-auto rounded-2xl" style={{ maxHeight: '80vh' }}>
          {/* Enhanced Header with Priority Icon */}
          <div
            className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: priorityConfig.color,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{
                    backgroundColor: `${priorityConfig.color}20`,
                    color: priorityConfig.color,
                  }}
                >
                  {task.priority === 'urgent' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none pb-1"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900 break-words">{task.title}</h2>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Priority */}
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {TASK_STATUSES.map(s => (
                  <option key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm"
                style={{
                  backgroundColor: `${priorityConfig.color}20`,
                  color: priorityConfig.color,
                  borderColor: `${priorityConfig.color}40`,
                }}
              >
                {priorityConfig.label}
              </span>
              {task.due_date && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Description
              </h3>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided'}</p>
              )}
            </div>

            {/* Edit/Save buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setIsEditing(false);
                    setEditTitle(task.title);
                    setEditDescription(task.description || '');
                  }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Task
                </Button>
              )}
            </div>

            {/* Links */}
            {(contact || campaign) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Related Items</h3>
                {contact && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Contact</div>
                      <div className="text-sm font-medium text-purple-700">{contact.business_name}</div>
                    </div>
                  </div>
                )}
                {campaign && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Campaign</div>
                      <div className="text-sm font-medium text-blue-700">{campaign.name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Checklist with Progress Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Checklist
                </h3>
                {checklists.length > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {completedChecklists}/{checklists.length} completed
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {checklists.length > 0 && (
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">{checklistProgress}%</div>
                </div>
              )}

              <div className="space-y-2">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 transition-transform hover:scale-110"
                    />
                    <span className={`flex-1 text-sm transition-all ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button size="sm" onClick={handleAddChecklistItem}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Comments with User Avatars */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments ({comments.length})
              </h3>
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                      {(comment.author || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{comment.author || 'User'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAddComment();
                      }
                    }}
                    placeholder="Add a comment... (Ctrl+Enter to submit)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddComment}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </h3>
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(activity.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button variant="danger" size="sm" onClick={onDelete} className="w-full justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Task
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

// Calendar View Component
function CalendarView({
  tasks,
  onTaskClick,
  onAddTask,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (date: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Get previous month days to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Generate calendar days
  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Next month days to complete the grid (6 rows)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  // Get tasks for a specific date
  function getTasksForDate(date: Date): Task[] {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.due_date === dateStr);
  }

  // Navigate months
  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-white/60 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-white/60 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const dateStr = dayInfo.date.toISOString().split('T')[0];
            const dayTasks = getTasksForDate(dayInfo.date);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const hasOverdue = dayTasks.some(t => t.status !== 'done' && isPast);

            return (
              <div
                key={index}
                className={`min-h-[100px] border rounded-lg p-2 transition-all ${
                  dayInfo.isCurrentMonth
                    ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                    : 'bg-gray-50 border-gray-100'
                } ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                onClick={() => dayInfo.isCurrentMonth && onAddTask(dateStr)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  !dayInfo.isCurrentMonth ? 'text-gray-400' :
                  isToday ? 'text-blue-600' :
                  isPast ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {dayInfo.date.getDate()}
                </div>

                {/* Task Pills */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
                    const isOverdue = task.status !== 'done' && isPast;

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium truncate cursor-pointer transition-all hover:scale-[1.02] ${
                          task.status === 'done'
                            ? 'bg-green-100 text-green-700 line-through'
                            : isOverdue
                            ? 'bg-red-100 text-red-700'
                            : ''
                        }`}
                        style={
                          task.status !== 'done' && !isOverdue
                            ? {
                                backgroundColor: `${priorityConfig.color}20`,
                                color: priorityConfig.color,
                              }
                            : undefined
                        }
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium px-2">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span className="text-gray-600">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
          <span className="text-gray-600">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-gray-600">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Completed</span>
        </div>
      </div>
    </div>
  );
}
