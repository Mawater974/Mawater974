'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { MapPinIcon } from '@heroicons/react/24/outline';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  KeyIcon,
  ArrowLeftIcon,
  TruckIcon as CarIcon,
} from '@heroicons/react/24/outline';
import ChangePassword from '@/components/ChangePassword';
import LoadingSpinner from '@/components/LoadingSpinner';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { countries, updateUserCountry } = useCountry();
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    country_id: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, countries(*)')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        country_id: data.country_id?.toString() || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('profile.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
          email: editForm.email,
          country_id: editForm.country_id ? parseInt(editForm.country_id) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update auth email if it changed
      if (editForm.email !== user?.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: editForm.email,
        });
        if (updateEmailError) throw updateEmailError;
      }

      await fetchProfile();
      setIsEditing(false);
      toast.success(t('profile.success.updated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.error.update'));
    } finally {
      setLoading(false);
    }
  };

  // Track page view
 useEffect(() => {
  const trackPageView = async () => {
    try {
      const response = await fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: '--', // Default to Qatar since this is a global page
          userId: user?.id,
          pageType: 'profile'
        })
      });

      if (!response.ok) {
        console.error('Failed to track page view:', await response.json());
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  trackPageView();
}, [user?.id]);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {t('profile.title')}
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isEditing ? t('profile.cancel') : t('profile.edit')}
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 py-5 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.fullName')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.form.email')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.form.phone')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone_number"
                        id="phone_number"
                        value={editForm.phone_number.replace(/^(\+\d{1,3})(\d+)/, '$1-$2')}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.country')}
                    </label>
                    <div className="mt-1">
                      <select
                        id="country"
                        name="country"
                        value={editForm.country_id}
                        onChange={(e) => setEditForm({ ...editForm, country_id: e.target.value })}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                      >
                        <option value="">{t('profile.selectCountry')}</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id.toString()}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    {t('profile.form.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
                  >
                    {loading ? t('profile.form.saving') : t('profile.form.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {profile?.full_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile?.role === 'admin' ? t('profile.role.admin') : t('profile.role.user')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:grid-cols-3">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{profile?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {profile?.phone_number?.replace(/^(\+\d{1,3})(\d+)/, '$1-$2') || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {countries?.find((c) => c.id === profile?.country_id)?.name}
                    </span>
                  </div>
                </div>

                {/* Change Password Section */}
                {!isEditing && profile && (
                  <div className="mt-8">
                    <ChangePassword 
                      userId={profile.id} 
                      currentPlainPassword={profile.password_plain || ''} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
