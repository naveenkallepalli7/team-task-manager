import { useState, useEffect } from 'react';
import { Users, ShieldCheck, UserX, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../api';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Deactivate ${name}? They will lose access.`)) return;
    try {
      await usersAPI.delete(id);
      toast.success(`${name} deactivated`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch { toast.error('Failed'); }
  };

  const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Users</h2>
          <p>{users.length} active user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <Users size={40} />
          <h3>No users found</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar">{getInitials(u.name)}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</span></td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                      {u.role === 'admin' ? <ShieldCheck size={11} /> : null}
                      {u.role}
                    </span>
                  </td>
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id, u.name)}>
                      <UserX size={13} /> Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
