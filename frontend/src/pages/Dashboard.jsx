import { NavLink, Outlet } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '.', label: 'Inventario', end: true },
  { to: 'asignaciones', label: 'Asignaciones', requiresManage: true },
  { to: 'productos/nuevo', label: 'Ingresar producto', requiresManage: true },
  { to: 'guias', label: 'Guías de despacho', requiresManage: true },
  { to: 'bajas', label: 'Bajas de inventario', requiresManage: true },
];

function Dashboard() {
  const { user, logout, hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER');

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresManage || canManage),
    [canManage]
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Bienvenido, {user.name}</h1>
          <p className="muted">Rol: {user.role}</p>
        </div>
        <button type="button" className="logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <nav className="dashboard-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'dashboard-nav-link active' : 'dashboard-nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
