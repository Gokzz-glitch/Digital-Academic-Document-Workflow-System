import React, { useEffect, useState } from 'react';
import { createUser, getAllUsers, toggleUserStatus } from '../../api/admin.api';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';
import { FiSearch, FiPower, FiX } from 'react-icons/fi';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', page: 1, limit: 15 });
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'class_advisor', department: '', year: '', section: '', rollNumber: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(filters);
      setUsers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleUserStatus(id);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to change user status');
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createUser(newUser);
      toast.success('Academic account created');
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'class_advisor', department: '', year: '', section: '', rollNumber: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create account');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: 'Name', cell: (row) => <div className="font-medium text-slate-800">{row.name}</div> },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', cell: (row) => <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{row.role.replace('_', ' ')}</span> },
    { header: 'Department', cell: (row) => row.department || '-' },
    { 
      header: 'Status', 
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      cell: (row) => (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleToggleStatus(row._id, row.isActive)}
            className={`${row.isActive ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-emerald-600'} transition-colors`}
            title={row.isActive ? "Deactivate User" : "Activate User"}
          >
            <FiPower />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-1">Create staff accounts and manage access for students and approvers.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Add academic account
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10 w-full"
            placeholder="Search name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        
        <select 
          className="form-input w-full sm:w-auto text-sm py-1.5"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="class_advisor">Class Advisor</option>
          <option value="hod">HOD</option>
          <option value="admin_staff">Admin Staff</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <DataTable 
        columns={columns} 
        data={users} 
        loading={loading} 
        emptyTitle="No users found"
        emptyDesc="No users match your current search and filter criteria."
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
          <form onSubmit={handleCreateUser} className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div><h2 id="create-user-title" className="text-lg font-semibold text-slate-900">Create academic account</h2><p className="mt-1 text-sm text-slate-500">Create a student or staff account for the academic workflow.</p></div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><FiX /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Full name<input required className="form-input mt-1 w-full" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Institutional email<input required type="email" className="form-input mt-1 w-full" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Temporary password<input required type="password" minLength="8" className="form-input mt-1 w-full" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></label>
              <label className="text-sm font-medium text-slate-700">Role<select className="form-input mt-1 w-full" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value="class_advisor">Class Advisor</option><option value="hod">Head of Department</option><option value="dean">Dean</option><option value="admin_staff">Academic Office Staff</option><option value="student">Student</option></select></label>
              <label className="text-sm font-medium text-slate-700">Department<input required className="form-input mt-1 w-full" placeholder="e.g. AIML" value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} /></label>
              {newUser.role === 'class_advisor' && <><label className="text-sm font-medium text-slate-700">Year (optional)<input className="form-input mt-1 w-full" value={newUser.year} onChange={(e) => setNewUser({ ...newUser, year: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Section (optional)<input className="form-input mt-1 w-full" value={newUser.section} onChange={(e) => setNewUser({ ...newUser, section: e.target.value })} /></label></>}
              {newUser.role === 'student' && <label className="text-sm font-medium text-slate-700">Roll number<input required className="form-input mt-1 w-full" value={newUser.rollNumber} onChange={(e) => setNewUser({ ...newUser, rollNumber: e.target.value })} /></label>}
            </div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create account'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
