import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, X, Trash2, Edit2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksAPI, projectsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const STATUSES = ['', 'Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['', 'Low', 'Medium', 'High'];

export default function TasksPage() {
  const { isAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    search: '', status: '', priority: '', projectId: '',
    overdue: searchParams.get('overdue') === 'true' ? 'true' : '',
  });
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'Pending', projectId: '' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.search) params.search = filters.search;
      if (filters.overdue) params.overdue = filters.overdue;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    projectsAPI.getAll().then((r) => setProjects(r.data.projects)).catch(() => {});
    if (isAdmin) usersAPI.getAll().then((r) => setUsers(r.data.users)).catch(() => {});
  }, [isAdmin]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', status: 'Pending', projectId: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description || '',
      assignedTo: task.assignedTo?._id || '', dueDate: task.dueDate?.split('T')[0] || '',
      priority: task.priority, status: task.status, projectId: task.projectId?._id || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTask) {
        await tasksAPI.update(editingTask._id, form);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(form);
        toast.success('Task created');
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const getStatusBadge = (status) => {
    const map = { Pending: 'badge-pending', 'In Progress': 'badge-progress', Completed: 'badge-completed' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const selectedProject = projects.find((p) => p._id === form.projectId);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Tasks</h2>
          <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
        {isAdmin && (
          <button id="create-task-btn" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="form-control" type="text" placeholder="Search tasks…"
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="form-control" style={{ width: 150 }} value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {STATUSES.slice(1).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="form-control" style={{ width: 140 }} value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          {PRIORITIES.slice(1).map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="form-control" style={{ width: 160 }} value={filters.projectId}
          onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <button className={`btn ${filters.overdue ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilters({ ...filters, overdue: filters.overdue ? '' : 'true' })}>
          {filters.overdue ? '⚠ Overdue' : 'Show Overdue'}
        </button>
        {(filters.search || filters.status || filters.priority || filters.projectId || filters.overdue) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', priority: '', projectId: '', overdue: '' })}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="card empty-state">
          <Search size={40} />
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create a new task.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                {isAdmin && <th>Assigned To</th>}
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const overdue = isPast(new Date(task.dueDate)) && task.status !== 'Completed';
                const canEdit = isAdmin || task.assignedTo?._id === user?._id;
                return (
                  <tr key={task._id}>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 280 }} className="truncate">{task.title}</div>
                      {task.description && <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }} className="truncate">{task.description}</div>}
                    </td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{task.projectId?.name || '—'}</span></td>
                    {isAdmin && (
                      <td>
                        {task.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.62rem' }}>{getInitials(task.assignedTo.name)}</div>
                            <span style={{ fontSize: '0.82rem' }}>{task.assignedTo.name}</span>
                          </div>
                        ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unassigned</span>}
                      </td>
                    )}
                    <td>
                      <span style={{ fontSize: '0.82rem', color: overdue ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: overdue ? 600 : 400 }}>
                        {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td><span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span></td>
                    <td>
                      {!isAdmin && canEdit ? (
                        <select className="form-control" style={{ padding: '4px 8px', fontSize: '0.8rem', width: 130 }}
                          value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)}>
                          {STATUSES.slice(1).map((s) => <option key={s}>{s}</option>)}
                        </select>
                      ) : getStatusBadge(task.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {canEdit && (
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(task)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(task._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" type="text" placeholder="Task title"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Task details…"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select className="form-control" value={form.projectId}
                  onChange={(e) => { setForm({ ...form, projectId: e.target.value, assignedTo: '' }); }} required>
                  <option value="">Select Project</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.slice(1).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-control" value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">Unassigned</option>
                    {(selectedProject?.members || users).map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-control" type="date"
                    value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
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
