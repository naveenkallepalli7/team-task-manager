import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, X, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const STATUS_ORDER = ['Pending', 'In Progress', 'Completed'];
const STATUS_COLORS = {
  Pending: { col: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'In Progress': { col: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  Completed: { col: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'Pending' });
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll({ projectId: id }),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) usersAPI.getAll().then((r) => setUsers(r.data.users)).catch(() => {});
  }, [id, isAdmin]);

  const openCreate = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'Pending' });
    setShowTaskModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      status: task.status,
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTask) {
        await tasksAPI.update(editingTask._id, taskForm);
        toast.success('Task updated');
      } else {
        await tasksAPI.create({ ...taskForm, projectId: id });
        toast.success('Task created');
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!project) return <div className="page-container"><p>Project not found.</p></div>;

  const tasksByStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-container fade-in">
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/projects" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-header-left">
            <h2>{project.name}</h2>
            {project.description && <p>{project.description}</p>}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
        {/* Members strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Users size={15} color="var(--text-muted)" />
          <div style={{ display: 'flex', gap: 6 }}>
            {project.members?.map((m) => (
              <div key={m._id} className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }} title={m.name}>
                {getInitials(m.name)}
              </div>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.members?.length} members</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUS_ORDER.map((status) => {
          const { col, bg } = STATUS_COLORS[status];
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: col, display: 'inline-block' }} />
                  <h3>{status}</h3>
                </div>
                <span style={{ background: bg, color: col, borderRadius: 99, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {tasksByStatus[status]?.length}
                </span>
              </div>
              {tasksByStatus[status]?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>No tasks</div>
              ) : (
                tasksByStatus[status].map((task) => {
                  const overdue = isPast(new Date(task.dueDate)) && task.status !== 'Completed';
                  const canEdit = isAdmin || task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
                  return (
                    <div key={task._id} className="task-card" onClick={() => canEdit && openEdit(task)}>
                      <div className="task-card-title">{task.title}</div>
                      {task.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                          {task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description}
                        </p>
                      )}
                      <div className="task-card-meta">
                        <span style={{ fontSize: '0.74rem', color: overdue ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                          {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`badge badge-${task.priority?.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>{task.priority}</span>
                          {task.assignedTo && (
                            <div className="user-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }} title={task.assignedTo.name}>
                              {getInitials(task.assignedTo.name)}
                            </div>
                          )}
                          {isAdmin && (
                            <button className="btn btn-icon" style={{ padding: '2px', background: 'none', border: 'none', color: 'var(--color-danger)', opacity: 0.6 }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Quick status move for members */}
                      {!isAdmin && canEdit && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
                          {STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                            <button key={s} className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(task, s); }}>
                              → {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" type="text" placeholder="Task title"
                  value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required disabled={!isAdmin} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Task details…"
                  value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{ resize: 'vertical' }} disabled={!isAdmin} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} disabled={!isAdmin}>
                    {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUS_ORDER.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select className="form-control" value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      {project.members?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-control" type="date"
                    value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required disabled={!isAdmin} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={16} />}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
