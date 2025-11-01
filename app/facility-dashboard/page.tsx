'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Button } from '../../components/ui/button';

export default function FacilityDashboard() {
  const { user, profile, isDealer, isAdmin, isFacilityOwner } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/auth/signin');
        toast.error('Please sign in to access the facility dashboard');
        return;
      }

      // Check if user has facility_owner role
      if (!isFacilityOwner) {
        toast.error('You do not have permission to access this page');
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkAccess();
  }, [user, isFacilityOwner, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isFacilityOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You do not have permission to access the facility dashboard. Please contact support if you believe this is an error.
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Link href="/" passHref>
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
            <Link href="/contact" passHref>
              <Button>Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Facility Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dashboard Cards */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">Welcome</h3>
              <p className="mt-2 text-blue-600 dark:text-blue-300">
                Welcome to your facility dashboard. This is where you'll manage your facility operations.
              </p>
            </div>

            {/* Add more dashboard widgets and functionality here */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
