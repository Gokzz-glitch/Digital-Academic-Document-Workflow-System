import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/auth.api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ResetPasswordPage = () => {
  const { resetToken } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(resetToken, password);
      setCompleted(true);
      toast.success('Password updated. Sign in with your new password.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'This reset link is invalid or expired');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">DW</div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Return to sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          {completed ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">Your password has been updated.</p>
              <Link to="/login" className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Sign in</Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm new password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={isSubmitting} className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
