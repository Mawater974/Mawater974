'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { CheckIcon, XMarkIcon, EyeIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCountry } from '@/contexts/CountryContext';

interface DealershipRequest {
  id: number;
  user_id: string;
  business_name: string;
  business_name_ar: string;
  description: string;
  description_ar: string;
  location: string;
  dealership_type: string;
  business_type: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewer_id?: string;
  review_notes?: string;
  reviewed_at?: string;
  userInfo?: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  featured: boolean;
  country_code: string;
}

export default function DealershipRequestsPage() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { language, t, dir, currentLanguage } = useLanguage();
  const [requests, setRequests] = useState<DealershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DealershipRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRequest, setEditingRequest] = useState<DealershipRequest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const { currentCountry } = useCountry();
  const [selectedShowroom, setSelectedShowroom] = useState<DealershipRequest | null>(null);

  const getUserInfo = async (userId: string): Promise<{ full_name: string; email: string; phone_number: string }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone_number')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return data as { full_name: string; email: string; phone_number: string };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        full_name: '',
        email: '',
        phone_number: ''
      };
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

    // In fetchRequests, make sure featured is properly set
    const requestsWithUserInfo = await Promise.all(
      data.map(async (request) => {
        const userInfo = await getUserInfo(request.user_id);
        return {
          ...request,
          userInfo,
          featured: request.featured === true, // Ensure boolean conversion
          country_code: currentCountry?.code || ''
        } as DealershipRequest;
      })
    );

      setRequests(requestsWithUserInfo);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error(t('admin.dealership.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('dealerships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dealerships',
        },
        async (payload) => {
          try {
            switch (payload.eventType) {
              case 'INSERT':
                const userInfo = await getUserInfo(payload.new.user_id);
                setRequests(prev => [
                  {
                    ...payload.new,
                    userInfo,
                    featured: payload.new.featured || false,
                    country_code: payload.new.country_code || ''
                  } as DealershipRequest,
                  ...prev
                ]);
                break;

              case 'UPDATE':
                setRequests(prev => 
                  prev.map(req => 
                    req.id === payload.new.id 
                      ? {
                          ...req,
                          ...payload.new,
                          featured: payload.new.featured || req.featured,
                          country_code: payload.new.country_code || req.country_code
                        } as DealershipRequest
                      : req
                  )
                );
                break;

              case 'DELETE':
                setRequests(prev => prev.filter(req => req.id !== payload.old.id));
                break;
            }
          } catch (error) {
            console.error('Error updating requests:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .rpc('approve_dealership', {
          dealership_id: selectedRequest.id,
          reviewer_id: user?.id,
          notes: reviewNotes
        });
      
      if (error) throw error;
      
      toast.success(t('admin.dealership.approveSuccess'), {
        duration: 5000,
        id: 'approve-toast',
      });
      
      // Close the modal (the list will be updated via real-time subscription)
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t('admin.dealership.approveError'), {
        duration: 5000,
        id: 'approve-toast',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .rpc('reject_dealership', {
          dealership_id: selectedRequest.id,
          reviewer_id: user?.id,
          notes: reviewNotes
        });
      
      if (error) throw error;
      
      toast.success(t('admin.dealership.rejectSuccess'), {
        duration: 5000,
        id: 'reject-toast',
      });
      
      // Close the modal (the list will be updated via real-time subscription)
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('admin.dealership.rejectError'), {
        duration: 5000,
        id: 'reject-toast',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (request: DealershipRequest) => {
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('dealerships')
        .update({
          business_name: request.business_name,
          business_name_ar: request.business_name_ar,
          description: request.description,
          description_ar: request.description_ar,
          location: request.location,
          dealership_type: request.dealership_type,
          business_type: request.business_type,
          logo_url: request.logo_url,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(t('admin.dealership.updatedSuccess'));
      setEditingRequest(null);
    } catch (error) {
      console.error('Error updating dealership:', error);
      toast.error(t('admin.dealership.updatedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (request: DealershipRequest) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('dealerships')
        .delete()
        .eq('id', request.id);

      if (error) throw error;

      toast.success(t('admin.dealership.deletedSuccess'));
      setRequests(prev => prev.filter(r => r.id !== request.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting dealership:', error);
      toast.error(t('admin.dealership.deletedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFeatured = async (request: DealershipRequest) => {
    if (!request) return;
    
    try {
      setIsSubmitting(true);
      
      // Log the current state for debugging
      console.log('Current featured status:', request.featured);
      console.log('Setting to:', !request.featured);
      
      const { error } = await supabase
        .from('dealerships')
        .update({
          featured: !request.featured
        })
        .eq('id', request.id);
  
      if (error) throw error;
  
      toast.success(
        request.featured 
          ? t('admin.dealership.unfeaturedSuccess') 
          : t('admin.dealership.featuredSuccess')
      );
      
      // Update local state
      setRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, featured: !r.featured } : r)
      );
      
      // Reset UI state
      setIsFeaturedModalOpen(false);
      setSelectedShowroom(null);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error(t('admin.dealership.featuredError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewShowroom = (dealership: DealershipRequest) => {
    window.open(`/${currentCountry?.code.toLowerCase()}/showrooms/${dealership.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('admin.dealership.requests.title')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {request.logo_url && (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={request.logo_url}
                        alt={request.business_name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' ? request.business_name_ar : request.business_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-qatar-maroon/10 text-qatar-maroon dark:bg-qatar-maroon/20">
                      {request.dealership_type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-qatar-maroon/10 text-qatar-maroon dark:bg-qatar-maroon/20">
                      {request.business_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 text-qatar-maroon hover:text-qatar-maroon-dark transition-colors"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}
                    {request.status === 'approved' && (
                      <>
                        <button
                          onClick={() => setEditingRequest(request)}
                          className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                          title={t('admin.dealership.edit')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          title={t('admin.dealership.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedShowroom(request);
                            setIsFeaturedModalOpen(true);
                          }}
                          className="p-2 text-yellow-500 hover:text-yellow-700 transition-colors"
                          title={request.featured ? t('admin.dealership.removeFeatured') : t('admin.dealership.setFeatured')}
                        >
                          {request.featured ? (
                            <StarIcon className="h-5 w-5 fill-yellow-500" /> // Fill the star when featured
                          ) : (
                            <StarIcon className="h-5 w-5" /> // Outline only when not featured
                          )}
                        </button>
                        <button
                          onClick={() => handleViewShowroom(request)}
                          className="p-2 text-green-500 hover:text-green-700 transition-colors"
                          title={t('admin.dealership.view')}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}>
                    {t(`admin.dealership.status.${request.status}`)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(request.created_at).toLocaleDateString(currentLanguage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentLanguage === 'ar' ? selectedRequest.business_name_ar : selectedRequest.business_name}
                  </h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.description')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {currentLanguage === 'ar' ? selectedRequest.description_ar : selectedRequest.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.contactInfo')}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">{t('common.email')}:</span>
                          <span className="text-gray-600 dark:text-gray-300">{selectedRequest.userInfo?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">{t('common.phone')}:</span>
                          <span className="text-gray-600 dark:text-gray-300">{selectedRequest.userInfo?.phone_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.dealershipType')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{selectedRequest.dealership_type}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.businessType')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{selectedRequest.business_type}</p>
                    </div>
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {t('admin.dealership.reviewNotes')}
                        </h3>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                          rows={3}
                          placeholder={t('admin.dealership.reviewNotesPlaceholder')}
                        />
                      </div>

                      <div className="flex justify-end gap-4">
                        <button
                          onClick={handleReject}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          {t('admin.dealership.reject')}
                        </button>
                        <button
                          onClick={handleApprove}
                          className="px-6 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon-dark transition-colors"
                        >
                          {t('admin.dealership.approve')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Request Modal */}
        {editingRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentLanguage === 'ar' ? editingRequest.business_name_ar : editingRequest.business_name}
                  </h2>
                  <button
                    onClick={() => setEditingRequest(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.businessName')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.business_name}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, business_name: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.businessNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.businessNameAr')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.business_name_ar}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, business_name_ar: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.businessNameArPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.description')}
                      </h3>
                      <textarea
                        value={editingRequest.description}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, description: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        rows={3}
                        placeholder={t('dealership.descriptionPlaceholder')}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.descriptionAr')}
                      </h3>
                      <textarea
                        value={editingRequest.description_ar}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, description_ar: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        rows={3}
                        placeholder={t('dealership.descriptionArPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.location')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.location}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, location: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.locationPlaceholder')}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.dealershipType')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.dealership_type}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, dealership_type: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.dealershipTypePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.businessType')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.business_type}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, business_type: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.businessTypePlaceholder')}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t('dealership.logoUrl')}
                      </h3>
                      <input
                        type="text"
                        value={editingRequest.logo_url}
                        onChange={(e) => setEditingRequest(prev => prev ? {...prev, logo_url: e.target.value} : null)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-qatar-maroon focus:border-qatar-maroon transition-colors"
                        placeholder={t('dealership.logoUrlPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => handleEdit(editingRequest)}
                      className="px-6 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon-dark transition-colors"
                    >
                      {t('admin.dealership.update')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Request Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('admin.dealership.deleteConfirm')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('admin.dealership.deleteConfirmMessage')}
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => handleDelete(editingRequest)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {t('admin.dealership.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured confirmation modal */}
        {isFeaturedModalOpen && selectedShowroom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {selectedShowroom.featured 
                  ? t('admin.dealership.confirmUnfeature') 
                  : t('admin.dealership.confirmFeature')}
              </h3>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                {selectedShowroom.featured 
                  ? t('admin.dealership.confirmUnfeatureDesc') 
                  : t('admin.dealership.confirmFeatureDesc')}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsFeaturedModalOpen(false);
                    setSelectedShowroom(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleToggleFeatured(selectedShowroom)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : selectedShowroom.featured ? (
                    t('admin.dealership.removeFeatured')
                  ) : (
                    t('admin.dealership.setFeatured')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
