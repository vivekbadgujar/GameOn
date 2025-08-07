import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Bell,
  Wallet,
  Shield,
  Video,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };

  const toggleDropdown = (key) => {
    setDropdownOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      key: 'dashboard'
    },
    {
      title: 'Tournaments',
      icon: Trophy,
      key: 'tournaments',
      submenu: [
        { title: 'All Tournaments', path: '/admin/tournaments' },
        { title: 'Create Tournament', path: '/admin/tournaments/create' },
        { title: 'Live Tournaments', path: '/admin/tournaments/live' },
        { title: 'Tournament Templates', path: '/admin/tournaments/templates' }
      ]
    },
    {
      title: 'Users',
      icon: Users,
      key: 'users',
      submenu: [
        { title: 'All Users', path: '/admin/users' },
        { title: 'Banned Users', path: '/admin/users/banned' },
        { title: 'User Analytics', path: '/admin/users/analytics' }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      key: 'notifications',
      submenu: [
        { title: 'Send Notification', path: '/admin/notifications/send' },
        { title: 'Notification History', path: '/admin/notifications/history' },
        { title: 'Templates', path: '/admin/notifications/templates' }
      ]
    },
    {
      title: 'Wallet & Payments',
      icon: Wallet,
      key: 'wallet',
      submenu: [
        { title: 'Wallet Overview', path: '/admin/wallet' },
        { title: 'Transactions', path: '/admin/wallet/transactions' },
        { title: 'Payouts', path: '/admin/wallet/payouts' },
        { title: 'Revenue Analytics', path: '/admin/wallet/analytics' }
      ]
    },
    {
      title: 'Anti-Cheat',
      icon: Shield,
      key: 'anticheat',
      submenu: [
        { title: 'AI Verification', path: '/admin/ai-verification' },
        { title: 'Flagged Screenshots', path: '/admin/ai-verification/flagged' },
        { title: 'Cheat Reports', path: '/admin/anticheat/reports' }
      ]
    },
    {
      title: 'Videos',
      icon: Video,
      path: '/admin/videos',
      key: 'videos'
    },
    {
      title: 'Settings',
      icon: Settings,
      key: 'settings',
      submenu: [
        { title: 'General Settings', path: '/admin/settings/general' },
        { title: 'Admin Users', path: '/admin/settings/admins' },
        { title: 'System Logs', path: '/admin/settings/logs' }
      ]
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const isActiveSubmenu = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
        <h1 className="text-xl font-bold text-white">GameOn Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.key}>
            {item.submenu ? (
              <div>
                <button
                  onClick={() => toggleDropdown(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActiveSubmenu(item.submenu)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.title}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      dropdownOpen[item.key] ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {dropdownOpen[item.key] && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActiveRoute(subItem.path)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActiveRoute(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white">
            <div className="absolute top-0 right-0 p-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="ml-2 text-xl font-semibold text-gray-800 lg:ml-0">
              Admin Panel
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, Admin
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;