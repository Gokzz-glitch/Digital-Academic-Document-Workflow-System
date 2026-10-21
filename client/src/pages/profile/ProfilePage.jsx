import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth.api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfilePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      // Idealy, we'd refetch the user context here
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await updateProfile({ 
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account settings and personal information.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 flex items-center gap-6 border-b border-slate-100 bg-slate-50">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            {user?.department && (
              <span className="inline-block mt-2 px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                {user?.department}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Cannot be changed)</label>
              <input type="email" value={user?.email || ''} disabled className="form-input w-full bg-slate-50 text-slate-500" />
            </div>
            {user?.role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                  <input type="text" value={user?.rollNumber || ''} disabled className="form-input w-full bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year & Section</label>
                  <input type="text" value={`Year ${user?.year || '-'} / Sec ${user?.section || '-'}`} disabled className="form-input w-full bg-slate-50 text-slate-500" />
                </div>
              </div>
            )}
            <div className="pt-2">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
                {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="password" required minLength="6" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input type="password" required minLength="6" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="form-input w-full" />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loading} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
                {loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
