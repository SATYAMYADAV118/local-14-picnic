import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition, Tab, Listbox } from '@headlessui/react';
import { useRequest } from '../hooks/useRequest';
import { useBoot } from '../hooks/useBoot';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ToastContext';
import { cn } from '../utils/cn';

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To-Do' },
  { id: 'progress', label: 'In-Progress' },
  { id: 'done', label: 'Completed' }
] as const;

type StatusFilter = (typeof statusTabs)[number]['id'];
type TaskStatus = 'todo' | 'progress' | 'done';

type Task = {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: string;
  due_date?: string | null;
  url?: string;
  assignee_id?: number | null;
  assignee_name?: string | null;
  assignee_avatar?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_by_avatar?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CrewMember = {
  id: number;
  wp_user_id: number | null;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
};

function matchesFilter(filter: StatusFilter | undefined, status: TaskStatus) {
  if (!filter || filter === 'all') {
    return true;
  }
  return filter === status;
}

export function Tasks() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();
  const { call } = useRequest();
  const client = useQueryClient();
  const { currentUser, isCoordinator } = useBoot();

  const tasksQuery = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: () => call<{ data: Task[] }>(activeTab === 'all' ? '/tasks' : `/tasks?status=${activeTab}`)
  });

  const crewQuery = useQuery({
    queryKey: ['crew', 'options'],
    queryFn: () => call<{ data: CrewMember[] }>('/crew')
  });

  const applyToTaskQueries = (
    updater: (tasks: Task[], filter?: StatusFilter) => Task[] | undefined
  ) => {
    const queries = client.getQueriesData<{ data: Task[] }>({ queryKey: ['tasks'] });
    queries.forEach(([key, value]) => {
      if (!value) return;
      const filter = (key as [string, StatusFilter?])[1];
      const existing = Array.isArray(value.data) ? value.data : [];
      const next = updater(existing, filter);
      if (next && next !== existing) {
        client.setQueryData(key, { ...value, data: next });
      }
    });

    const dashboardKey: [string, string] = ['dashboard', 'tasks'];
    const dashboard = client.getQueryData<{ data: Task[] }>(dashboardKey);
    if (dashboard) {
      const existing = Array.isArray(dashboard.data) ? dashboard.data : [];
      const next = updater(existing);
      if (next && next !== existing) {
        client.setQueryData(dashboardKey, { ...dashboard, data: next });
      }
    }
  };

  const restoreTasks = (snapshot: {
    queries: Array<[unknown, { data: Task[] } | undefined]>;
    dashboard: { data: Task[] } | undefined;
  }) => {
    snapshot.queries.forEach(([key, value]) => {
      client.setQueryData(key, value);
    });
    if (snapshot.dashboard) {
      client.setQueryData(['dashboard', 'tasks'], snapshot.dashboard);
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      call<Task>(`/tasks/${id}/status`, 'POST', { status }),
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = {
        queries: client.getQueriesData<{ data: Task[] }>({ queryKey: ['tasks'] }),
        dashboard: client.getQueryData<{ data: Task[] }>(['dashboard', 'tasks'])
      };

      const currentTask = tasksQuery.data?.data.find((task) => task.id === id);
      const previousStatus = currentTask?.status ?? 'todo';
      const draftTask: Task = { ...currentTask, status } as Task;

      applyToTaskQueries((tasks, filter) => {
        const hasTask = tasks.some((task) => task.id === id);
        const shouldExistBefore = hasTask || matchesFilter(filter, previousStatus as TaskStatus);
        const shouldExistAfter = matchesFilter(filter, status);

        if (shouldExistBefore && shouldExistAfter) {
          return tasks.map((task) => (task.id === id ? { ...task, ...draftTask } : task));
        }

        if (shouldExistBefore && !shouldExistAfter) {
          return tasks.filter((task) => task.id !== id);
        }

        if (!shouldExistBefore && shouldExistAfter) {
          return [draftTask, ...tasks];
        }

        return tasks;
      });

      return { snapshot };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.snapshot) {
        restoreTasks(context.snapshot);
      }
      toast(error.message || 'Unable to update task', 'error');
    },
    onSuccess: (task) => {
      applyToTaskQueries((tasks) =>
        tasks.some((existing) => existing.id === task.id)
          ? tasks.map((existing) => (existing.id === task.id ? task : existing))
          : tasks
      );
      toast('Task updated', 'success');
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['tasks'] });
      client.invalidateQueries({ queryKey: ['dashboard', 'tasks'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => call<Task>('/tasks', 'POST', payload),
    onMutate: async (payload: any) => {
      await client.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = {
        queries: client.getQueriesData<{ data: Task[] }>({ queryKey: ['tasks'] }),
        dashboard: client.getQueryData<{ data: Task[] }>(['dashboard', 'tasks'])
      };

      const optimisticId = Number.MIN_SAFE_INTEGER + Date.now();
      const assignee = (crewQuery.data?.data ?? []).find(
        (member) => member.wp_user_id === payload.assignee_id
      );

      const optimisticTask: Task = {
        id: optimisticId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'todo',
        priority: payload.priority,
        due_date: payload.due_date,
        url: payload.url,
        assignee_id: payload.assignee_id,
        assignee_name: assignee?.name ?? (payload.assignee_id === currentUser?.id ? currentUser?.name : ''),
        assignee_avatar: assignee?.avatar_url,
        created_by: currentUser?.id ?? null,
        created_by_name: currentUser?.name ?? '',
        created_by_avatar: currentUser?.avatar ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      applyToTaskQueries((tasks, filter) => {
        if (!matchesFilter(filter, optimisticTask.status)) {
          return tasks;
        }
        return [optimisticTask, ...tasks];
      });

      return { snapshot, optimisticId };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.snapshot) {
        restoreTasks(context.snapshot);
      }
      toast(error.message || 'Unable to create task', 'error');
    },
    onSuccess: (task, _variables, context) => {
      applyToTaskQueries((tasks) =>
        tasks.map((existing) => (existing.id === context?.optimisticId ? task : existing))
      );
      toast('Task created', 'success');
      setIsOpen(false);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['tasks'] });
      client.invalidateQueries({ queryKey: ['dashboard', 'tasks'] });
    }
  });

  const tasks = tasksQuery.data?.data ?? [];
  const myTasks = useMemo(
    () => tasks.filter((task) => task.assignee_id === currentUser?.id),
    [tasks, currentUser]
  );
  const otherTasks = useMemo(
    () => tasks.filter((task) => task.assignee_id !== currentUser?.id),
    [tasks, currentUser]
  );

  function handleStatusChange(task: Task, status: TaskStatus) {
    if (!isCoordinator && currentUser?.id !== task.assignee_id) {
      toast('You can only update your own tasks', 'info');
      return;
    }
    updateMutation.mutate({ id: task.id, status });
  }

  return (
    <Card title="Task Management" subtitle="My tasks appear first" isLoading={tasksQuery.isLoading}>
      <div className="flex items-center justify-between gap-4">
        <Tab.Group selectedIndex={statusTabs.findIndex((tab) => tab.id === activeTab)} onChange={(index) => setActiveTab(statusTabs[index].id)}>
          <Tab.List className="flex rounded-full bg-slate-100 p-1">
            {statusTabs.map((tab) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  cn(
                    'rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    selected ? 'bg-white text-slate-900 shadow-soft ring-[var(--l4p-primary)] ring-offset-white' : 'text-slate-500 hover:text-slate-700'
                  )
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-accent)]"
        >
          Add Task
        </button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TaskList title="My Tasks" tasks={myTasks} onUpdate={handleStatusChange} allowActions />
        <TaskList title="Other Tasks" tasks={otherTasks} onUpdate={handleStatusChange} allowActions={isCoordinator} />
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={setIsOpen} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="translate-y-6 opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-soft">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Create task</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">
                    Assign work to any crew member. They’ll see the update instantly and receive a notification.
                  </p>
                  <TaskForm
                    onSubmit={(payload) => createMutation.mutate(payload)}
                    onCancel={() => setIsOpen(false)}
                    currentUserId={currentUser?.id ?? 0}
                    crew={crewQuery.data?.data ?? []}
                    isLoading={crewQuery.isLoading}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Card>
  );
}

function TaskList({
  title,
  tasks,
  onUpdate,
  allowActions
}: {
  title: string;
  tasks: Task[];
  onUpdate: (task: Task, status: TaskStatus) => void;
  allowActions: boolean;
}) {
  return (
    <div className="h-[440px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">Priority: {task.priority ?? 'medium'}</p>
                {task.due_date && (
                  <p className="text-xs text-slate-400">Due {new Date(task.due_date).toLocaleDateString()}</p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                {task.status}
              </span>
            </div>
            {task.description && (
              <p className="mt-3 text-sm text-slate-600">{task.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              {task.created_by_avatar && (
                <img src={task.created_by_avatar} alt={task.created_by_name ?? 'Assigner'} className="h-6 w-6 rounded-full object-cover" />
              )}
              <span>
                Assigned by <strong>{task.created_by_name ?? 'Coordinator'}</strong>
                {task.assignee_name && (
                  <>
                    {' '}to <strong>{task.assignee_name}</strong>
                  </>
                )}
                {task.created_at && ` on ${new Date(task.created_at).toLocaleDateString()}`}
              </span>
            </div>
            {allowActions && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(['todo', 'progress', 'done'] as TaskStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdate(task, status)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      task.status === status
                        ? 'bg-[var(--l4p-primary)] text-white focus-visible:ring-[var(--l4p-accent)]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 focus-visible:ring-[var(--l4p-primary)]'
                    )}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks in this view.</p>}
      </div>
    </div>
  );
}

function TaskForm({
  onSubmit,
  onCancel,
  currentUserId,
  crew,
  isLoading
}: {
  onSubmit: (payload: any) => void;
  onCancel: () => void;
  currentUserId: number;
  crew: CrewMember[];
  isLoading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState<number | null>(currentUserId || null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      due_date: dueDate,
      assignee_id: assignee,
      status: 'todo'
    });
  }

  const options = crew.filter((member) => member.wp_user_id !== null);

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold text-slate-600">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-600">Priority</label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Assign to</label>
        <Listbox value={assignee} onChange={setAssignee}>
          <div className="relative mt-1">
            <Listbox.Button className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm focus:border-[var(--l4p-primary)] focus:outline-none">
              <span>
                {assignee
                  ? options.find((member) => member.wp_user_id === assignee)?.name ?? 'Select member'
                  : 'Unassigned'}
              </span>
              <span aria-hidden className="text-xs text-slate-400">▼</span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
                <Listbox.Option
                  key="unassigned"
                  value={null}
                  className={({ active }) =>
                    cn('cursor-pointer px-4 py-2 text-sm', active && 'bg-slate-100 text-slate-900')
                  }
                >
                  Unassigned
                </Listbox.Option>
                {options.map((member) => (
                  <Listbox.Option
                    key={member.id}
                    value={member.wp_user_id}
                    className={({ active }) =>
                      cn('flex cursor-pointer items-center gap-3 px-4 py-2 text-sm', active && 'bg-slate-100 text-slate-900')
                    }
                  >
                    {member.avatar_url && (
                      <img src={member.avatar_url} alt={member.name} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <span>{member.name}</span>
                    <span className="ml-auto text-xs uppercase text-slate-400">{member.role}</span>
                  </Listbox.Option>
                ))}
                {isLoading && <p className="px-4 py-2 text-xs text-slate-400">Loading crew…</p>}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        <p className="mt-1 text-xs text-slate-400">Tip: choose yourself for quick personal reminders.</p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-accent)]"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}
