import { useEffect, useState } from 'react';
import { fetchJSON, sendJSON } from '../utils/api';
import { useDraft } from '../utils/useDraft';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority?: string;
  due_date?: string;
  assignee_id?: number;
}

interface TaskComment {
  id: number;
  task_id: number;
  parent_id?: number | null;
  author_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

const emptyTask: Partial<Task> = {
  title: '',
  description: '',
  status: 'todo'
};

export const TasksView: React.FC<Props> = ({ addToast }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task>>(emptyTask);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const draft = useDraft('tasks-draft', editingTask);
  const canWrite =
    l4pApp.currentUser.roles.includes('l4p_coordinator') ||
    (l4pApp.currentUser.roles.includes('l4p_volunteer') && l4pApp.settings.volunteer_create_tasks);
  const canComment = l4pApp.currentUser.roles.includes('l4p_coordinator') || l4pApp.currentUser.roles.includes('l4p_volunteer');
  const isCoordinator = l4pApp.currentUser.roles.includes('l4p_coordinator');

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draft.update(editingTask);
  }, [editingTask]);

  useEffect(() => {
    if (!isEditing) {
      draft.clear();
    }
  }, [isEditing]);

  const loadTasks = () => {
    fetchJSON<Task[]>('tasks')
      .then((items) => {
        setTasks(items);
      })
      .catch(() => addToast({ type: 'error', message: 'Unable to load tasks.' }))
      .finally(() => setLoading(false));
  };

  const openDrawer = (task?: Task) => {
    setIsEditing(true);
    setEditingTask(task ? { ...task } : draft.value || emptyTask);
    if (task && task.id) {
      loadComments(task.id);
    } else {
      setComments([]);
    }
  };

  const closeDrawer = () => {
    setIsEditing(false);
    setEditingTask(emptyTask);
    setComments([]);
  };

  const handleSave = async () => {
    if (!canWrite) {
      return;
    }
    try {
      if (editingTask.id) {
        await sendJSON<Task>(`tasks/${editingTask.id}`, 'POST', editingTask as Task);
        addToast({ type: 'success', message: 'Task updated.' });
      } else {
        await sendJSON<Task>('tasks', 'POST', editingTask as Task);
        addToast({ type: 'success', message: 'Task created.' });
      }
      closeDrawer();
      loadTasks();
      window.dispatchEvent(new CustomEvent('l4p-refresh-dashboard'));
    } catch (error) {
      addToast({ type: 'error', message: 'Could not save task.' });
    }
  };

  const loadComments = (taskId: number) => {
    setCommentsLoading(true);
    fetchJSON<TaskComment[]>(`tasks/${taskId}/comments`)
      .then((items) => setComments(items))
      .catch(() => addToast({ type: 'error', message: 'Unable to load comments.' }))
      .finally(() => setCommentsLoading(false));
  };

  const handleCommentSubmit = async (body: string, parentId?: number | null) => {
    if (!editingTask.id) {
      return;
    }

    try {
      await sendJSON<TaskComment>(`tasks/${editingTask.id}/comments`, 'POST', {
        body,
        parent_id: parentId || undefined
      });
      addToast({ type: 'success', message: 'Comment added.' });
      loadComments(editingTask.id);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not add comment.' });
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!editingTask.id) {
      return;
    }
    try {
      await fetchJSON(`tasks/comments/${commentId}`, { method: 'DELETE' });
      addToast({ type: 'success', message: 'Comment removed.' });
      loadComments(editingTask.id);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not remove comment.' });
    }
  };

  const commentTree = buildCommentTree(comments);

  const filteredTasks = filter ? tasks.filter((task) => task.status === filter) : tasks;

  return (
    <div className="l4p-stack">
      <header className="l4p-toolbar">
        <h1>Tasks</h1>
        <div className="l4p-toolbar-actions">
          <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter tasks by status">
            <option value="">All</option>
            <option value="todo">To do</option>
            <option value="doing">In progress</option>
            <option value="done">Done</option>
          </select>
          {canWrite && (
            <button className="l4p-button" onClick={() => openDrawer()}>
              New Task
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="l4p-skeleton" aria-busy="true" />
      ) : (
        <table className="l4p-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Priority</th>
              <th scope="col">Due</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.status}</td>
                <td>{task.priority || '—'}</td>
                <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                <td>
                  {canWrite && (
                    <button className="l4p-link" onClick={() => openDrawer(task)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="l4p-empty">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isEditing && (
        <div className="l4p-drawer" role="dialog" aria-modal="true">
          <div className="l4p-drawer-content">
            <header>
              <h2>{editingTask.id ? 'Edit Task' : 'Create Task'}</h2>
              <button aria-label="Close" onClick={closeDrawer}>
                ×
              </button>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSave();
              }}
            >
              <label>
                Title
                <input
                  value={editingTask.title || ''}
                  onChange={(event) => setEditingTask((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={editingTask.description || ''}
                  onChange={(event) => setEditingTask((prev) => ({ ...prev, description: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={editingTask.status || 'todo'}
                  onChange={(event) => setEditingTask((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="todo">To do</option>
                  <option value="doing">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Priority
                <input
                  value={editingTask.priority || ''}
                  onChange={(event) => setEditingTask((prev) => ({ ...prev, priority: event.target.value }))}
                />
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  value={editingTask.due_date ? editingTask.due_date.substring(0, 10) : ''}
                  onChange={(event) => setEditingTask((prev) => ({ ...prev, due_date: event.target.value }))}
                />
              </label>
              <footer>
                <button type="submit" className="l4p-button">
                  Save
                </button>
              </footer>
            </form>
            {editingTask.id && (
              <section className="l4p-task-discussion">
                <header>
                  <h3>Discussion</h3>
                </header>
                {commentsLoading ? (
                  <div className="l4p-skeleton" aria-busy="true" />
                ) : (
                  <TaskCommentsList
                    comments={commentTree}
                    onReply={handleCommentSubmit}
                    onDelete={handleCommentDelete}
                    canComment={canComment}
                    canDelete={(comment) => isCoordinator || comment.author_id === l4pApp.currentUser.id}
                    taskId={editingTask.id}
                  />
                )}
                {canComment ? (
                  <TaskCommentComposer
                    storageKey={`task-${editingTask.id}-root`}
                    onSubmit={(body) => handleCommentSubmit(body)}
                    label="Add a comment"
                  />
                ) : (
                  <p className="l4p-muted">You do not have permission to comment on tasks.</p>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type TaskCommentNode = TaskComment & { children: TaskCommentNode[] };

const buildCommentTree = (items: TaskComment[]): TaskCommentNode[] => {
  const map = new Map<number, TaskCommentNode>();
  const roots: TaskCommentNode[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

interface TaskCommentsListProps {
  comments: TaskCommentNode[];
  onReply: (body: string, parentId?: number | null) => void;
  onDelete: (id: number) => void;
  canComment: boolean;
  canDelete: (comment: TaskComment) => boolean;
  taskId: number;
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = ({ comments, onReply, onDelete, canComment, canDelete, taskId }) => {
  if (comments.length === 0) {
    return <p className="l4p-empty">No comments yet.</p>;
  }

  return (
    <ul className="l4p-comment-thread">
      {comments.map((comment) => (
        <TaskCommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
          canComment={canComment}
          canDelete={canDelete}
          taskId={taskId}
        />
      ))}
    </ul>
  );
};

interface TaskCommentItemProps {
  comment: TaskCommentNode;
  onReply: (body: string, parentId?: number | null) => void;
  onDelete: (id: number) => void;
  canComment: boolean;
  canDelete: (comment: TaskComment) => boolean;
  taskId: number;
}

const TaskCommentItem: React.FC<TaskCommentItemProps> = ({ comment, onReply, onDelete, canComment, canDelete, taskId }) => {
  const [showReply, setShowReply] = useState(false);
  const draftKey = `task-${taskId}-reply-${comment.id}`;

  return (
    <li className="l4p-comment-item">
      <div className="l4p-comment-body">
        <header>
          <strong>{comment.author_name}</strong>
          <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString()}</time>
        </header>
        <p dangerouslySetInnerHTML={{ __html: comment.body }} />
        <div className="l4p-comment-actions">
          {canComment && (
            <button className="l4p-link" onClick={() => setShowReply((prev) => !prev)}>
              {showReply ? 'Cancel' : 'Reply'}
            </button>
          )}
          {canDelete(comment) && (
            <button className="l4p-link l4p-danger" onClick={() => onDelete(comment.id)}>
              Delete
            </button>
          )}
        </div>
      </div>
      {showReply && canComment && (
        <div className="l4p-comment-reply">
          <TaskCommentComposer
            storageKey={draftKey}
            onSubmit={(body) => {
              onReply(body, comment.id);
              setShowReply(false);
            }}
            label="Reply"
          />
        </div>
      )}
      {comment.children.length > 0 && (
        <ul className="l4p-comment-children">
          {comment.children.map((child) => (
            <TaskCommentItem
              key={child.id}
              comment={child}
              onReply={onReply}
              onDelete={onDelete}
              canComment={canComment}
              canDelete={canDelete}
              taskId={taskId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

interface TaskCommentComposerProps {
  storageKey: string;
  onSubmit: (body: string) => void;
  label: string;
}

const TaskCommentComposer: React.FC<TaskCommentComposerProps> = ({ storageKey, onSubmit, label }) => {
  const draft = useDraft<string>(storageKey, '');

  return (
    <div className="l4p-comment-composer">
      <textarea
        value={draft.value || ''}
        onChange={(event) => draft.update(event.target.value)}
        placeholder={label}
      />
      <button
        className="l4p-button"
        onClick={() => {
          if (!draft.value || !draft.value.trim()) {
            return;
          }
          onSubmit(draft.value);
          draft.clear();
        }}
      >
        {label}
      </button>
    </div>
  );
};
