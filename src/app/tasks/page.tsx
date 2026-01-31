'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clay-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-clay-900">Tasks</h1>
          <p className="text-[13px] text-clay-500 mt-0.5">
            {filteredTasks.length} tasks
            {overdueTasks.length > 0 && (
              <span className="text-status-red-text font-medium"> • {overdueTasks.length} overdue</span>
            )}
            <span className="text-clay-400"> • </span>
            <span className="text-status-green-text font-medium">{completedToday} completed today</span>
            {upcomingThisWeek > 0 && (
              <>
                <span className="text-clay-400"> • </span>
                <span className="text-status-blue-text font-medium">{upcomingThisWeek} upcoming this week</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-clay-200 overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-clay-100 text-clay-900'
                  : 'text-clay-500 hover:bg-clay-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors border-l border-r border-clay-200 ${
                viewMode === 'board'
                  ? 'bg-clay-100 text-clay-900'
                  : 'text-clay-500 hover:bg-clay-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Board
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-clay-100 text-clay-900'
                  : 'text-clay-500 hover:bg-clay-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
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

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={tasks.length.toString()}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label="Overdue"
          value={overdueTasks.length.toString()}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks.length.toString()}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={doneTasks.length.toString()}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className={`px-3 py-1.5 rounded-lg border text-[12px] bg-white transition-colors ${
              filterStatus !== 'all'
                ? 'border-clay-400 bg-clay-50 text-clay-900 font-medium'
                : 'border-clay-200 hover:border-clay-300 text-clay-600'
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
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className={`px-3 py-1.5 rounded-lg border text-[12px] bg-white transition-colors ${
              filterPriority !== 'all'
                ? 'border-clay-400 bg-clay-50 text-clay-900 font-medium'
                : 'border-clay-200 hover:border-clay-300 text-clay-600'
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

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-clay-500 hover:text-clay-700 bg-white border border-clay-200 rounded-lg hover:bg-clay-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* View Content */}
      <div>
        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
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
              <div className="text-center py-16 px-4 bg-white rounded-lg border border-clay-200">
                <div className="w-14 h-14 mx-auto mb-4 bg-clay-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-clay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-clay-900 mb-1">No tasks yet</h3>
                <p className="text-[13px] text-clay-500 mb-6 max-w-sm mx-auto">
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

        {/* Board View */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-3 gap-4">
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

// Task Group Component (List View)
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
      bg: 'bg-status-red-bg',
      border: 'border-status-red-dot/30',
      text: 'text-status-red-text',
      dot: 'bg-status-red-dot',
    },
    warning: {
      bg: 'bg-status-yellow-bg',
      border: 'border-status-yellow-dot/30',
      text: 'text-status-yellow-text',
      dot: 'bg-status-yellow-dot',
    },
    default: {
      bg: 'bg-status-blue-bg',
      border: 'border-status-blue-dot/30',
      text: 'text-status-blue-text',
      dot: 'bg-status-blue-dot',
    },
    muted: {
      bg: 'bg-clay-50',
      border: 'border-clay-200',
      text: 'text-clay-600',
      dot: 'bg-clay-400',
    },
    success: {
      bg: 'bg-status-green-bg',
      border: 'border-status-green-dot/30',
      text: 'text-status-green-text',
      dot: 'bg-status-green-dot',
    },
  };

  const config = variantConfig[variant];

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg ${config.bg} border ${config.border} mb-2 transition-colors hover:opacity-90`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
          <span className={`font-medium text-sm ${config.text}`}>{title}</span>
          <span className={`text-[11px] font-medium ${config.text} bg-white/60 px-1.5 py-0.5 rounded`}>
            {count}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ${config.text} transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="space-y-2 pl-2">
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

// Task Column Component (Board View)
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
      bg: 'bg-clay-50',
      border: 'border-clay-200',
      headerBg: 'bg-clay-100',
      headerText: 'text-clay-700',
      dot: 'bg-clay-400',
    },
    in_progress: {
      bg: 'bg-status-blue-bg/30',
      border: 'border-status-blue-dot/20',
      headerBg: 'bg-status-blue-bg',
      headerText: 'text-status-blue-text',
      dot: 'bg-status-blue-dot',
    },
    done: {
      bg: 'bg-status-green-bg/30',
      border: 'border-status-green-dot/20',
      headerBg: 'bg-status-green-bg',
      headerText: 'text-status-green-text',
      dot: 'bg-status-green-dot',
    },
  };

  const config = columnConfig[status];

  return (
    <div className={`${config.bg} rounded-lg border ${config.border} overflow-hidden flex flex-col`}>
      <div className={`flex items-center justify-between px-4 py-3 ${config.headerBg} border-b ${config.border}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
          <h3 className={`font-medium text-sm ${config.headerText}`}>{title}</h3>
        </div>
        <span className={`text-[11px] font-bold ${config.headerText} bg-white/60 px-2 py-0.5 rounded`}>
          {count}
        </span>
      </div>
      <div className="p-3 space-y-2 min-h-[400px] flex-1">
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
            <div className="w-10 h-10 mx-auto mb-2 bg-white/60 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-clay-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[12px] text-clay-500 font-medium">No tasks yet</p>
          </div>
        )}
      </div>
      {/* Add Task Button */}
      <div className="p-3 border-t border-clay-200/50">
        <button
          onClick={onAddTask}
          className="w-full py-2 rounded-lg hover:bg-white/60 text-clay-500 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>
    </div>
  );
}

// Task Card Component
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
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'done';

  function getPriorityStyles(priority: TaskPriority) {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-status-red-bg', text: 'text-status-red-text', border: 'border-status-red-dot/30' };
      case 'high':
        return { bg: 'bg-status-orange-bg', text: 'text-status-orange-text', border: 'border-status-orange-dot/30' };
      case 'medium':
        return { bg: 'bg-status-blue-bg', text: 'text-status-blue-text', border: 'border-status-blue-dot/30' };
      case 'low':
        return { bg: 'bg-clay-100', text: 'text-clay-500', border: 'border-clay-200' };
      default:
        return { bg: 'bg-clay-100', text: 'text-clay-500', border: 'border-clay-200' };
    }
  }

  const priorityStyles = getPriorityStyles(task.priority);
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={`bg-white rounded-lg border p-3 cursor-pointer transition-all group hover:shadow-sm ${
        task.status === 'done'
          ? 'opacity-60 border-clay-200'
          : isOverdue
          ? 'border-status-red-dot/30 hover:border-status-red-dot/50'
          : 'border-clay-200 hover:border-clay-400'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done');
          }}
          className="mt-0.5 h-4 w-4 rounded border-clay-300 text-clay-600 focus:ring-clay-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm text-clay-900 ${task.status === 'done' ? 'line-through text-clay-500' : ''}`}>
            {task.title}
          </div>

          {!compact && task.description && (
            <div className="text-[12px] text-clay-500 mt-1 line-clamp-2">{task.description}</div>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                isOverdue
                  ? 'bg-status-red-bg text-status-red-text'
                  : 'bg-clay-100 text-clay-500'
              }`}>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium border ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border}`}>
              {priorityConfig.label}
            </span>
            {contactName && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-status-purple-bg text-status-purple-text font-medium">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {contactName}
              </span>
            )}
            {campaignName && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-status-blue-bg text-status-blue-text font-medium">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// Task Templates
const TASK_TEMPLATES = [
  { name: 'Follow up with lead', description: 'Follow up with contact via email or call', priority: 'high' as TaskPriority },
  { name: 'Send proposal', description: 'Prepare and send project proposal', priority: 'high' as TaskPriority },
  { name: 'Review response', description: 'Write response to negative review', priority: 'medium' as TaskPriority },
  { name: 'Schedule meeting', description: 'Set up discovery call with prospect', priority: 'medium' as TaskPriority },
  { name: 'Update CRM', description: 'Update contact information and notes', priority: 'low' as TaskPriority },
];

// Create Task Modal
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
  const [showTemplates, setShowTemplates] = useState(false);

  function applyTemplate(template: typeof TASK_TEMPLATES[0]) {
    setTitle(template.name);
    setDescription(template.description);
    setPriority(template.priority);
    setShowTemplates(false);
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
            className="flex items-center gap-1.5 text-[12px] text-clay-600 hover:text-clay-900 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Use Template
            <svg className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTemplates && (
            <div className="mt-2 grid grid-cols-1 gap-1.5 p-3 bg-clay-50 rounded-lg border border-clay-200">
              {TASK_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-clay-200 flex items-center justify-center text-clay-600 text-[11px] font-bold">
                    {template.name[0]}
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-clay-900">{template.name}</div>
                    <div className="text-[11px] text-clay-500">{template.description}</div>
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
          <label className="block text-sm font-medium text-clay-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            className="w-full px-3 py-2 rounded-lg border border-clay-200 h-24 resize-none text-sm text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-clay-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-lg border border-clay-200 text-sm text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400"
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

        <div className="grid grid-cols-2 gap-4">
          <ContactSearchInput
            label="Contact"
            value={contactId}
            onChange={(id) => setContactId(id)}
            placeholder="Search by name, email, business, city..."
          />
          <div>
            <label className="block text-sm font-medium text-clay-700 mb-1">Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-clay-200 text-sm text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400"
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

// Task Detail Panel
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

  function getPriorityColor(priority: TaskPriority) {
    switch (priority) {
      case 'urgent':
        return 'bg-status-red-bg text-status-red-text border-status-red-dot/30';
      case 'high':
        return 'bg-status-orange-bg text-status-orange-text border-status-orange-dot/30';
      case 'medium':
        return 'bg-status-blue-bg text-status-blue-text border-status-blue-dot/30';
      case 'low':
        return 'bg-clay-100 text-clay-500 border-clay-200';
      default:
        return 'bg-clay-100 text-clay-500 border-clay-200';
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[700px] bg-white rounded-lg shadow-xl" style={{ maxHeight: '80vh' }}>
          <div className="h-full overflow-y-auto rounded-lg" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="sticky top-0 z-10 px-5 py-4 border-b border-clay-200 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold text-clay-900 w-full border-b-2 border-clay-400 focus:outline-none pb-1"
                      autoFocus
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-clay-900 break-words">{task.title}</h2>
                  )}
                  <p className="text-[12px] text-clay-500 mt-0.5">
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-clay-400 hover:text-clay-600 transition-colors p-1 rounded hover:bg-clay-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Status and Priority */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                className="px-3 py-1.5 rounded-lg border border-clay-200 text-sm font-medium text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400"
              >
                {TASK_STATUSES.map(s => (
                  <option key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getPriorityColor(task.priority)}`}>
                {priorityConfig.label}
              </span>
              {task.due_date && (
                <span className="flex items-center gap-1 text-[12px] text-clay-600 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="bg-clay-50 rounded-lg p-4 border border-clay-200">
              <h3 className="text-[11px] font-semibold text-clay-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Description
              </h3>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-clay-200 h-28 resize-none text-sm text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-clay-700 whitespace-pre-wrap">{task.description || 'No description provided'}</p>
              )}
            </div>

            {/* Edit/Save buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Task
                </Button>
              )}
            </div>

            {/* Related Items */}
            {(contact || campaign) && (
              <div className="bg-clay-50 rounded-lg p-4 border border-clay-200 space-y-2">
                <h3 className="text-[11px] font-semibold text-clay-500 uppercase tracking-wide mb-2">Related Items</h3>
                {contact && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-status-purple-bg rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-status-purple-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-clay-500">Contact</div>
                      <div className="text-[12px] font-medium text-status-purple-text">{contact.business_name}</div>
                    </div>
                  </div>
                )}
                {campaign && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-status-blue-bg rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-status-blue-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-clay-500">Campaign</div>
                      <div className="text-[12px] font-medium text-status-blue-text">{campaign.name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Checklist */}
            <div className="bg-white rounded-lg border border-clay-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold text-clay-500 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Checklist
                </h3>
                {checklists.length > 0 && (
                  <span className="text-[10px] font-medium text-clay-500">
                    {completedChecklists}/{checklists.length} completed
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {checklists.length > 0 && (
                <div className="mb-3">
                  <div className="h-1.5 bg-clay-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-green-dot transition-all duration-500"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-clay-400 mt-0.5">{checklistProgress}%</div>
                </div>
              )}

              <div className="space-y-1.5">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-clay-50 transition-colors group">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="rounded border-clay-300 text-status-green-dot focus:ring-status-green-dot/50"
                    />
                    <span className={`flex-1 text-[12px] ${item.is_completed ? 'line-through text-clay-400' : 'text-clay-700'}`}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-clay-400 hover:text-status-red-text transition-all p-1 rounded hover:bg-status-red-bg"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex-1 px-3 py-1.5 rounded-lg border border-clay-200 text-[12px] text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400"
                  />
                  <Button size="sm" onClick={handleAddChecklistItem}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg border border-clay-200 p-4">
              <h3 className="text-[11px] font-semibold text-clay-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments ({comments.length})
              </h3>
              <div className="space-y-2">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5 bg-clay-50 rounded-lg p-3 border border-clay-100">
                    <div className="w-7 h-7 rounded-full bg-clay-300 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
                      {(comment.author || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-clay-900">{comment.author || 'User'}</span>
                        <span className="text-[10px] text-clay-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[12px] text-clay-700 whitespace-pre-wrap">{comment.content}</p>
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
                    className="w-full px-3 py-2 rounded-lg border border-clay-200 text-[12px] text-clay-900 focus:outline-none focus:ring-2 focus:ring-clay-400 resize-none min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddComment}>
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <div className="pt-4 border-t border-clay-200">
              <Button variant="danger" size="sm" onClick={onDelete} className="w-full justify-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  function getPriorityColor(priority: TaskPriority) {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-status-red-bg', text: 'text-status-red-text' };
      case 'high':
        return { bg: 'bg-status-orange-bg', text: 'text-status-orange-text' };
      case 'medium':
        return { bg: 'bg-status-blue-bg', text: 'text-status-blue-text' };
      case 'low':
        return { bg: 'bg-clay-100', text: 'text-clay-500' };
      default:
        return { bg: 'bg-clay-100', text: 'text-clay-500' };
    }
  }

  return (
    <div className="bg-white rounded-lg border border-clay-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-clay-50 px-5 py-3 border-b border-clay-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-clay-900">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-[11px] font-medium text-clay-600 bg-white rounded border border-clay-200 hover:bg-clay-50 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-clay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-clay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div key={day} className="text-center text-[10px] font-semibold text-clay-500 py-1">
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

            return (
              <div
                key={index}
                className={`min-h-[90px] border rounded-lg p-1.5 transition-colors ${
                  dayInfo.isCurrentMonth
                    ? 'bg-white border-clay-200 hover:border-clay-400 cursor-pointer'
                    : 'bg-clay-50 border-clay-100'
                } ${isToday ? 'ring-2 ring-clay-400 ring-offset-1' : ''}`}
                onClick={() => dayInfo.isCurrentMonth && onAddTask(dateStr)}
              >
                <div className={`text-[11px] font-medium mb-1 ${
                  !dayInfo.isCurrentMonth ? 'text-clay-400' :
                  isToday ? 'text-clay-900' :
                  isPast ? 'text-clay-500' : 'text-clay-700'
                }`}>
                  {dayInfo.date.getDate()}
                </div>

                {/* Task Pills */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => {
                    const isOverdue = task.status !== 'done' && isPast;
                    const priorityColors = getPriorityColor(task.priority);

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium truncate cursor-pointer transition-colors ${
                          task.status === 'done'
                            ? 'bg-status-green-bg text-status-green-text line-through'
                            : isOverdue
                            ? 'bg-status-red-bg text-status-red-text'
                            : `${priorityColors.bg} ${priorityColors.text}`
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-clay-500 font-medium px-1">
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
      <div className="px-5 py-2.5 bg-clay-50 border-t border-clay-200 flex items-center gap-5 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-status-red-bg border border-status-red-dot/30"></div>
          <span className="text-clay-600">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-status-orange-bg border border-status-orange-dot/30"></div>
          <span className="text-clay-600">High Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-status-blue-bg border border-status-blue-dot/30"></div>
          <span className="text-clay-600">Medium Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-status-green-bg border border-status-green-dot/30"></div>
          <span className="text-clay-600">Completed</span>
        </div>
      </div>
    </div>
  );
}
