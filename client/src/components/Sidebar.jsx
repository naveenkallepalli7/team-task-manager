import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <h1>TaskFlow</h1>
            <p>Team Task Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Main Menu</p>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderKanban size={18} />
          Projects
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          Tasks
        </NavLink>

        {isAdmin && (
          <>
            <p className="nav-section-label" style={{ marginTop: 12 }}>Admin</p>
            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              Users
            </NavLink>
          </>
        )}
      </nav>

      {/* User profile at bottom */}
      <div className="sidebar-user">
        <div className="user-avatar">{getInitials(user?.name)}</div>
        <div className="user-info">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
        </div>
        <button
          className="btn btn-icon btn-secondary tooltip"
          data-tip="Logout"
          onClick={handleLogout}
          style={{ padding: '6px', marginLeft: 'auto' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
