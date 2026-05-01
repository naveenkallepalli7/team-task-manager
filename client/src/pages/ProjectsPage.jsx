import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, Trash2, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.projects);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProjects();
    if (isAdmin) usersAPI.getAll().then((r) => setUsers(r.data.users)).catch(() => {});
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', members: [] });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(userId)
        ? f.members.filter((id) => id !== userId)
        : [...f.members, userId],
    }));
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Projects</h2>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {projects.map((project) => (
            <div key={project._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Header */}
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderKanban size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{project.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(project._id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {project.description.length > 100 ? project.description.slice(0, 100) + '…' : project.description}
                </p>
              )}

              {/* Members */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} color="var(--text-muted)" />
                <div style={{ display: 'flex', gap: -4 }}>
                  {project.members?.slice(0, 4).map((m, i) => (
                    <div key={m._id} className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.65rem', marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-card)', zIndex: 4 - i }}>
                      {m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: -8 }}>
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Footer */}
              <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                View Tasks <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input id="project-name" className="form-control" type="text" placeholder="e.g. Website Redesign"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Project description…"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Add Members</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {users.map((u) => (
                    <button key={u._id} type="button"
                      onClick={() => toggleMember(u._id)}
                      style={{
                        padding: '6px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 500,
                        border: form.members.includes(u._id) ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: form.members.includes(u._id) ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                        color: form.members.includes(u._id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'var(--transition)',
                      }}>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="create-project-submit" className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={16} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
