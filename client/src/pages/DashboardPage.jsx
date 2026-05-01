import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertTriangle, ListTodo,
  FolderKanban, TrendingUp, Bell, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, isToday } from 'date-fns';

const COLORS = {
  Pending: '#f59e0b',
  'In Progress': '#6366f1',
  Completed: '#10b981',
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, tasksRes, projRes] = await Promise.all([
          tasksAPI.getStats(),
          tasksAPI.getAll({ limit: 5 }),
          projectsAPI.getAll(),
        ]);
        setStats(statsRes.data.stats);
        setRecentTasks(tasksRes.data.tasks.slice(0, 6));
        setProjects(projRes.data.projects.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: <ListTodo size={22} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: <CheckCircle size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: <TrendingUp size={22} />, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: <AlertTriangle size={22} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const getStatusBadge = (status) => {
    const map = { Pending: 'badge-pending', 'In Progress': 'badge-progress', Completed: 'badge-completed' };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  const isDueSoon = (d) => {
    const date = new Date(d);
    return isToday(date) || (isPast(date) && d.status !== 'Completed');
  };

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p>{isAdmin ? 'Here\'s your team\'s overview' : 'Here\'s your task overview'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <h3 style={{ color: s.color }}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Recent Tasks */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Pie Chart */}
        <div className="chart-container">
          <h3>Task Distribution</h3>
          {stats?.total === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No tasks yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats?.statusBreakdown}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats?.statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#131929', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }}
                  formatter={(v, n) => [v, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {stats?.statusBreakdown.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart by project (admin only) */}
        <div className="chart-container">
          <h3>{isAdmin ? 'Projects Overview' : 'My Task Status'}</h3>
          {isAdmin ? (
            projects.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}><p>No projects yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={projects.map((p) => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, members: p.members?.length || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#131929', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }} />
                  <Bar dataKey="members" fill="#6366f1" radius={[6, 6, 0, 0]} name="Members" />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131929', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats?.statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex-between mb-4">
          <h3 style={{ fontWeight: 700 }}>Recent Tasks</h3>
          <Link to="/tasks" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <div className="empty-state"><ListTodo size={32} /><h3>No tasks yet</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  {isAdmin && <th>Assigned To</th>}
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {task.projectId?.name || '—'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <span style={{ fontSize: '0.82rem' }}>{task.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</span>
                      </td>
                    )}
                    <td>
                      <span style={{ fontSize: '0.82rem', color: isPast(new Date(task.dueDate)) && task.status !== 'Completed' ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue alert */}
      {stats?.overdue > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', color: 'var(--color-danger)'
        }}>
          <Bell size={18} />
          <span style={{ fontSize: '0.88rem' }}>
            <strong>{stats.overdue}</strong> task{stats.overdue > 1 ? 's are' : ' is'} overdue.{' '}
            <Link to="/tasks?overdue=true" style={{ textDecoration: 'underline', color: 'inherit' }}>Review now →</Link>
          </span>
        </div>
      )}
    </div>
  );
}
