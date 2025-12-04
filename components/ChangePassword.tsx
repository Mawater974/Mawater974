'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ChangePasswordProps {
  userId: string;
  currentPlainPassword: string;
}

export default function ChangePassword({ userId, currentPlainPassword }: ChangePasswordProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!oldPassword || !newPassword || !confirmPassword) {
        toast.error('All fields are required');
        setLoading(false);
        return;
      }

      // Password length validation
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Verify new passwords match
      if (newPassword !== confirmPassword) {
        toast.error(t('profile.changePassword.mismatch'));
        setLoading(false);
        return;
      }

      // First verify current password by signing in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        console.error('Password verification failed:', signInError);
        toast.error(t('profile.changePassword.wrongPassword'));
        setLoading(false);
        return;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update failed:', updateError);
        throw updateError;
      }

      // Update the plain password in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          password_plain: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update failed:', profileError);
        throw profileError;
      }

      // Success!
      toast.success(t('profile.changePassword.success'));
      
      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

    } catch (error) {
      console.error('Change password error:', error);
      toast.error(t('profile.changePassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {t('profile.changePassword.title')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.changePassword.oldPassword')}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showOldPassword ? "text" : "password"}
              id="old-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              minLength={6}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
              />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-qatar-maroon"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.changePassword.newPassword')}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showNewPassword ? "text" : "password"}
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-qatar-maroon"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.changePassword.confirmPassword')}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-qatar-maroon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loading')}
              </span>
            ) : (
              t('profile.changePassword.button')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}