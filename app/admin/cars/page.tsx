'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Car } from '../../../types/supabase';
import { TrashIcon, StarIcon, CheckIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import EditCarModal from '../../../components/EditCarModal';
import { useCountry } from '../../../contexts/CountryContext';
import LoadingSpinner from '@/components/LoadingSpinner';


interface ExtendedCar extends Car {
  brand: {
    name: string;
  };
  model: {
    name: string;
  };
  user: {
    full_name: string;
    email: string;
  };
  images: {
    url: string;
    is_main: boolean;
  }[];
}

type CarStatus = 'Pending' | 'Approved' | 'Rejected' | 'Sold';
type SortOrder = 'newest' | 'oldest' | 'price_high' | 'price_low';

export default function AdminCarsPage() {
  const [cars, setCars] = useState<ExtendedCar[]>([]);
  const [editingCar, setEditingCar] = useState<ExtendedCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStatus, setActiveStatus] = useState<CarStatus>('Pending');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const { currentCountry } = useCountry();
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  useEffect(() => {
    checkAdminStatus();
    fetchCars();
  }, [user, activeStatus, sortOrder]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(profile?.role === 'admin');
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cars')
        .select(`
          *,
          brand:brands(name),
          model:models(name),
          user:profiles(full_name, email),
          images:car_images(url, is_main)
        `)
        .eq('status', activeStatus);

      // Apply sorting
      switch (sortOrder) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setCars(data);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type,
            title,
            message,
          }
        ]);

      if (error) throw error;
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const handleStatusChange = async (carId: number, newStatus: CarStatus) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId);

      if (error) throw error;

      // Create notification for the user
      const car = cars.find(c => c.id === carId);
      if (car) {
        if (newStatus === 'Approved') {
          await createNotification(
            car.user_id,
            'Car Listing Approved! 🎉',
            `Great news! Your ${car.brand.name} ${car.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
            'approval'
          );
        } else if (newStatus === 'Rejected') {
          await createNotification(
            car.user_id,
            'Car Listing Needs Updates ⚠️',
            `Your ${car.brand.name} ${car.model.name} listing requires some changes. You can edit and resubmit your listing at any time.`,
            'rejection'
          );
        } else if (newStatus === 'Sold') {
          await createNotification(
            car.user_id,
            'Car Marked as Sold 🎊',
            `Your ${car.brand.name} ${car.model.name} has been marked as sold. Congratulations on your sale!`,
            'sold'
          );
        }
      }

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error updating car status:', err);
      setError('Failed to update car status');
    }
  };

  const handleToggleFeature = async (carId: number, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_featured: !currentFeatured })
        .eq('id', carId);

      if (error) throw error;

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error updating featured status:', err);
      setError('Failed to update featured status');
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car listing?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      // Refresh the cars list
      fetchCars();
    } catch (err) {
      console.error('Error deleting car:', err);
      setError('Failed to delete car');
    }
  };

  const handleEdit = async (car: ExtendedCar) => {
    setEditingCar(car);
  };

  const handleAcceptAll = async () => {
    try {
      // Get all pending cars
      const { data: pendingCars, error: fetchError } = await supabase
        .from('cars')
        .select('id, brand:brands(name), model:models(name), user_id')
        .eq('status', 'Pending');

      if (fetchError) throw fetchError;

      if (!pendingCars || pendingCars.length === 0) {
        toast.info('No pending cars to approve');
        return;
      }

      // Update all pending cars to approved
      const { error: updateError } = await supabase
        .from('cars')
        .update({ status: 'Approved' })
        .eq('status', 'Pending');

      if (updateError) throw updateError;

      // Create notifications for all users
      for (const car of pendingCars) {
        await createNotification(
          car.user_id,
          'Car Listing Approved! 🎉',
          `Great news! Your ${car.brand.name} ${car.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
          'approval'
        );
      }

      toast.success(`Successfully approved ${pendingCars.length} cars`);
      fetchCars();
    } catch (err) {
      console.error('Error approving all cars:', err);
      toast.error('Failed to approve all cars');
    }
  };

  const handleSetSold = async () => {
    try {
      // Get all approved cars
      const { data: approvedCars, error: fetchError } = await supabase
        .from('cars')
        .select('id, brand:brands(name), model:models(name), user_id')
        .eq('status', 'Approved');

      if (fetchError) throw fetchError;

      if (!approvedCars || approvedCars.length === 0) {
        toast.info('No approved cars to set as sold');
        return;
      }

      // Update all approved cars to sold
      const { error: updateError } = await supabase
        .from('cars')
        .update({ status: 'Sold' })
        .eq('status', 'Approved');

      if (updateError) throw updateError;

      // Create notifications for all users
      for (const car of approvedCars) {
        await createNotification(
          car.user_id,
          'Car Marked as Sold 🎊',
          `Your ${car.brand.name} ${car.model.name} has been marked as sold. Congratulations on your sale!`,
          'sold'
        );
      }

      toast.success(`Successfully set ${approvedCars.length} cars as sold`);
      fetchCars();
    } catch (err) {
      console.error('Error setting all cars as sold:', err);
      toast.error('Failed to set all cars as sold');
    }
  };

  const handleSetApproved = async (carId?: number) => {
    try {
      if (carId) {
        // Get car details first
        const { data: car, error: fetchError } = await supabase
          .from('cars')
          .select('*, brand:brands(name), model:models(name)')
          .eq('id', carId)
          .single();

        if (fetchError) throw fetchError;

        // Update car status
        const { error } = await supabase
          .from('cars')
          .update({ status: 'Approved' })
          .eq('id', carId);

        if (error) throw error;

        // Create notification
        await createNotification(
          car.user_id,
          'Car Listing Approved! 🎉',
          `Great news! Your ${car.brand.name} ${car.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
          'approval'
        );

        toast.success('Car listing approved successfully');
        fetchCars();
      } else {
        // Get all rejected cars
        const { data: rejectedCars, error: fetchError } = await supabase
          .from('cars')
          .select('id, brand:brands(name), model:models(name), user_id')
          .eq('status', 'Rejected');

        if (fetchError) throw fetchError;

        if (!rejectedCars || rejectedCars.length === 0) {
          toast.info('No rejected cars to approve');
          return;
        }

        // Update all rejected cars to approved
        const { error: updateError } = await supabase
          .from('cars')
          .update({ status: 'Approved' })
          .eq('status', 'Rejected');

        if (updateError) throw updateError;

        // Create notifications for all users
        for (const car of rejectedCars) {
          await createNotification(
            car.user_id,
            'Car Listing Approved! 🎉',
            `Great news! Your ${car.brand.name} ${car.model.name} listing has been approved and is now live on our platform. Your car is now visible to potential buyers.`,
            'approval'
          );
        }

        toast.success(`Successfully approved ${rejectedCars.length} cars`);
        fetchCars();
      }
    } catch (err) {
      console.error('Error approving car:', err);
      toast.error('Failed to approve car listing');
    }
  };

  const handleSetPending = async (carId?: number) => {
    try {
      if (carId) {
        // Update single car to pending
        const { error } = await supabase
          .from('cars')
          .update({ status: 'Pending' })
          .eq('id', carId);

        if (error) throw error;

        toast.success('Car listing set to pending successfully');
      } else {
        // Get all rejected cars
        const { data: rejectedCars, error: fetchError } = await supabase
          .from('cars')
          .select('id')
          .eq('status', 'Rejected');

        if (fetchError) throw fetchError;

        if (!rejectedCars || rejectedCars.length === 0) {
          toast.info('No rejected cars to set to pending');
          return;
        }

        // Update all rejected cars to pending
        const { error: updateError } = await supabase
          .from('cars')
          .update({ status: 'Pending' })
          .eq('status', 'Rejected');

        if (updateError) throw updateError;

        toast.success(`Successfully set ${rejectedCars.length} cars to pending`);
      }

      fetchCars();
    } catch (err) {
      console.error('Error setting car to pending:', err);
      toast.error('Failed to set car to pending');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusTabs: { status: CarStatus; label: string }[] = [
    { status: 'Pending', label: 'Pending' },
    { status: 'Approved', label: 'Approved' },
    { status: 'Rejected', label: 'Rejected' },
    { status: 'Sold', label: 'Sold' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'price_low', label: 'Price: Low to High' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Car Listings</h1>
              </div>
              <div className="flex items-center space-x-4">
                {activeStatus === 'Pending' && (
                  <button
                    onClick={handleAcceptAll}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                  >
                    Accept All Pending
                  </button>
                )}
                {activeStatus === 'Approved' && (
                  <button
                    onClick={handleSetSold}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                  >
                    Set All as Sold
                  </button>
                )}
                {activeStatus === 'Rejected' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSetApproved}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                    >
                      Approve All
                    </button>
                    <button
                      onClick={handleSetPending}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors duration-200"
                    >
                      Set All to Pending
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md ${
                      viewMode === 'grid'
                        ? 'bg-qatar-maroon text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('detail')}
                    className={`px-3 py-1.5 rounded-md ${
                      viewMode === 'detail'
                        ? 'bg-qatar-maroon text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Detail
                  </button>
                </div>

                {/* Sort Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon">
                    Sort by
                    <ChevronDownIcon className="ml-2 h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <Menu.Item key={option.value}>
                            {({ active }) => (
                              <button
                                onClick={() => setSortOrder(option.value as SortOrder)}
                                className={`
                                  ${active ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                  ${sortOrder === option.value ? 'text-qatar-maroon' : 'text-gray-700 dark:text-gray-200'}
                                  group flex items-center w-full px-4 py-2 text-sm
                                `}
                              >
                                {option.label}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {statusTabs.map(({ status, label }) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`
                      whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeStatus === status
                          ? 'border-qatar-maroon text-qatar-maroon'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <LoadingSpinner />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-qatar-maroon dark:hover:border-qatar-maroon transition-colors duration-200"
                >
                  {/* Car Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                        alt={`${car.brand.name} ${car.model.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Car Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {car.brand.name} {car.model.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {car.year} • {car.mileage.toLocaleString()} km
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Featured Toggle */}
                        <button
                          onClick={() => handleToggleFeature(car.id, car.is_featured)}
                          className={`p-1.5 rounded-lg transition-colors duration-200 ${
                            car.is_featured 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={car.is_featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <StarIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-lg font-semibold text-qatar-maroon">
                        QAR {car.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Posted by: {car.user.full_name}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-end space-x-2">
                      <Link
                        href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEdit(car)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                      >
                        Edit
                      </button>
                      {activeStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(car.id, 'Approved')}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(car.id, 'Rejected')}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {activeStatus === 'Approved' && (
                        <button
                          onClick={() => handleStatusChange(car.id, 'Sold')}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                        >
                          Set as Sold
                        </button>
                      )}
                      {activeStatus === 'Rejected' && (
                        <>
                          <button
                            onClick={() => handleSetApproved(car.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleSetPending(car.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Set to Pending
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(car.id)}
                        className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Car</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-20 w-32 flex-shrink-0 mr-4 overflow-hidden rounded-lg">
                            {car.images && car.images.length > 0 ? (
                              <img
                                src={car.images.find(img => img.is_main)?.url || car.images[0].url}
                                alt={`${car.brand.name} ${car.model.name}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {car.brand.name} {car.model.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {car.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{car.user.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{car.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>Mileage: {car.mileage.toLocaleString()} km</div>
                          <div>Color: {car.color}</div>
                          <div>Transmission: {car.transmission}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        QAR {car.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            car.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : car.status === 'Rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : car.status === 'Sold'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }
                        `}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors duration-200"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleEdit(car)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                          >
                            Edit
                          </button>
                          {activeStatus === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(car.id, 'Approved')}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(car.id, 'Rejected')}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {activeStatus === 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(car.id, 'Sold')}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors duration-200"
                            >
                              Set as Sold
                            </button>
                          )}
                          {activeStatus === 'Rejected' && (
                            <>
                              <button
                                onClick={() => handleSetApproved(car.id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleSetPending(car.id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-600 hover:text-white rounded-md transition-colors duration-200"
                              >
                                Set to Pending
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(car.id)}
                            className="inline-flex items-center p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors duration-200"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Car Modal */}
          {editingCar && (
            <EditCarModal
              isOpen={!!editingCar}
              onClose={() => setEditingCar(null)}
              car={editingCar}
              onUpdate={fetchCars}
              onEditComplete={() => setEditingCar(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
