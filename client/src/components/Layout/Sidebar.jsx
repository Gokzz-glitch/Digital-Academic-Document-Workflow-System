import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, FiFileText, FiPlusSquare, FiUser, 
  FiCheckSquare, FiArchive, FiSettings, FiUsers, FiLayers 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const getNavItems = () => {
    const role = user?.role || 'student';
    const commonNav = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    ];
    
    if (role === 'student') {
      return [
        ...commonNav,
        { path: '/requests/my', icon: FiFileText, label: 'My Requests' },
        { path: '/requests/new', icon: FiPlusSquare, label: 'New Request' },
      ];
    }
    
    if (['class_advisor', 'hod', 'dean'].includes(role)) {
      return [
        ...commonNav,
        { path: '/requests/pending', icon: FiCheckSquare, label: 'Pending Approvals' },
        { path: '/requests/all', icon: FiArchive, label: 'History' },
      ];
    }
    
    if (role === 'admin_staff') {
      return [
        ...commonNav,
        { path: '/requests/all', icon: FiFileText, label: 'All Requests' },
        { path: '/admin/document-types', icon: FiLayers, label: 'Document Types' },
      ];
    }
    
    if (role === 'super_admin') {
      return [
        ...commonNav,
        { path: '/requests/all', icon: FiFileText, label: 'All Requests' },
        { path: '/admin/users', icon: FiUsers, label: 'Manage Users' },
        { path: '/admin/document-types', icon: FiLayers, label: 'Document Types' },
      ];
    }
    
    return commonNav;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              DW
            </div>
            <span className="text-white font-semibold tracking-wide">DocFlow</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-slate-800 text-white' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <FiUser className="w-5 h-5" />
            <span className="font-medium text-sm">Profile</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
