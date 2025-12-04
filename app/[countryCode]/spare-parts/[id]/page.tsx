'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Phone, Mail, MessageCircle, AlertCircle, Share2, Flag, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

// Using native button instead of shadcn/ui Button
const Button = ({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className={`px-4 py-2 rounded-md font-medium transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Simple toast function since we can't import useToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  console[type](message);
};

// Define types for our database responses
interface Brand {
  name: string;
  name_ar: string;
}

interface Model {
  name: string;
  name_ar: string;
}

interface Category {
  name_en: string;
  name_ar: string;
}

interface City {
  name: string;
  name_ar: string;
}

// This duplicate interface is removed as it's redundant

interface SparePartImage {
  id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
  spare_part_id: string;
  updated_at?: string;
  order?: number;
}

// Helper type to handle potentially string or object types
type WithName = { name: string; name_en?: string; name_ar?: string } | string | null;

// Helper functions to safely get names from WithName type
const getName = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name || '';
};

const getNameEn = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name_en || item.name || '';
};

const getNameAr = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name_ar || item.name || '';
};

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface CommentWithReplies {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  replies?: CommentWithReplies[];
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
}

interface SparePart {
  id: string;
  title: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  part_type: string;
  is_negotiable: boolean;
  condition: 'new' | 'used' | 'refurbished';
  status: 'approved' | 'sold' | 'pending' | 'expired' | 'hidden'| 'archived';
  created_at: string;
  updated_at: string;
  user: UserProfile;

  
  // Relations
  brand_id: string | null;
  model_id: string | null;
  category_id: string | null;
  city_id: string | null;
  user_id: string;
  country_id: string;
  
  // Joined data - can be objects or strings
  brand?: WithName;
  model?: WithName;
  category?: WithName & { name_en?: string };
  city?: City | null;
  user: UserProfile;
  
  images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    created_at: string;
  }>;
  
  country?: {
    id: string;
    name: string;
    code: string;
    flag: string;
    currency_code?: string;
  };
  
  featured?: boolean;
  is_featured?: boolean;
  
  // Make all fields optional to handle partial data from API
  [key: string]: any;
}

export default function SparePartDetails() {
  const params = useParams();
  const router = useRouter();
  const { currentLanguage, t } = useLanguage();
  const { currentCountry } = useCountry();
  const { user } = useAuth();

  // State declarations
  const [sparePart, setSparePart] = useState<SparePart | null>(null);
  const [currentImageIndex, setCurrentImage] = useState(0);
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [replyTo, setReplyTo] = useState<CommentWithReplies | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentWithReplies | null>(null);
  const [editContent, setEditContent] = useState('');
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [viewCounted, setViewCounted] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        
        // Fetch spare part data
        const { data: sparePartData, error: sparePartError } = await supabase
          .from('spare_parts')
          .select('*')
          .eq('id', params.id)
          .single();

        if (sparePartError) throw sparePartError;
        
        // Fetch user profile data
        const profileData = await fetchUserProfile(sparePartData.user_id);
        
        // Update state with fetched data
        setSparePart({
          ...sparePartData,
          user: profileData || {
            id: sparePartData.user_id,
            full_name: 'Unknown User',
            email: '',
            phone_number: '',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        
        setUserProfile(profileData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load spare part details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, fetchUserProfile]);

  // Image gallery functions
  const openFullImage = useCallback((index: number) => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(index);
    setFullImageIndex(index);
    setShowFullImage(true);
    document.body.style.overflow = 'hidden';
  }, [sparePart?.images]);

  const closeFullImage = useCallback(() => {
    setShowFullImage(false);
    document.body.style.overflow = 'unset';
  }, []);

  const handlePrevImage = useCallback(() => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(prevIndex => {
      const newIndex = prevIndex === 0 ? sparePart.images!.length - 1 : prevIndex - 1;
      setFullImageIndex(newIndex);
      return newIndex;
    });
  }, [sparePart?.images]);

  const handleNextImage = useCallback(() => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(prevIndex => {
      const newIndex = prevIndex === sparePart.images!.length - 1 ? 0 : prevIndex + 1;
      setFullImageIndex(newIndex);
      return newIndex;
    });
  }, [sparePart?.images]);

  useEffect(() => {
    if (user && sparePart) {
      const isOwner = user.id === sparePart.user_id;
    }
  }, [user, sparePart]);
  useEffect(() => {
    if (sparePart && !viewCounted) {
      const incrementViewCount = async () => {
        try {
          // Get current view count
          const { data: currentData } = await supabase
            .from('spare_parts')
            .select('views_count')
            .eq('id', sparePart.id)
            .single();

          const currentViews = currentData?.views_count || 0;

          // Increment view count
          const { error: updateError } = await supabase
            .from('spare_parts')
            .update({ views_count: currentViews + 1 })
            .eq('id', sparePart.id);

          if (updateError) throw updateError;
          
          // Update local state
          setSparePart(prev => prev ? { ...prev, views_count: currentViews + 1 } : null);
          setViewCounted(true);
        } catch (error) {
          console.error('Error incrementing view count:', error);
        }
      };

      incrementViewCount();
    }
  }, [sparePart, viewCounted]);



  // Handle keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullImage) return;
      
      switch (e.key) {
        case 'Escape':
          closeFullImage();
          break;
        case 'ArrowLeft':
          handlePrevImage();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullImage, handlePrevImage, handleNextImage, closeFullImage]);

  const supabase = createClient();

  useEffect(() => {
    const fetchSparePart = async () => {
      try {
        setLoading(true);
        const id = params.id as string;

        // First, get the spare part basic info
        const { data: sparePartData, error: sparePartError } = await supabase
          .from('spare_parts')
          .select('*')
          .eq('id', id)
          .single<{
            id: string;
            title: string;
            name_ar?: string;
            description: string;
            description_ar?: string;
            price: number;
            currency: string;
            part_type: string;
            is_negotiable: boolean;
            condition: 'new' | 'used' | 'refurbished';
            status: 'approved' | 'sold' | 'pending' | 'expired' | 'hidden';
            created_at: string;
            updated_at: string;
            brand_id: string | null;
            model_id: string | null;
            category_id: string | null;
            city_id: string | null;
            user_id: string;
            country_id: string;
            [key: string]: any; // For any additional properties
          }>();

        if (sparePartError) throw sparePartError;
        if (!sparePartData) throw new Error('Spare part not found');

        // Get related data with proper error handling
        const queries = [
          // Fetch images for the spare part
          (async () => {
            try {
              const { data, error } = await supabase
                .from('spare_part_images')
                .select('*')
                .eq('spare_part_id', sparePartData.id)
                .order('is_primary', { ascending: false }) // Primary image first
                .order('created_at', { ascending: true }); // Then by creation date
              
              if (error) throw error;
              return { data };
            } catch (err) {
              console.error('Error fetching images:', err);
              return { data: [] };
            }
          })(),
          
          // Fetch brand with error handling
          (async () => {
            try {
              const { data, error } = sparePartData.brand_id
                ? await supabase
                    .from('brands')
                    .select('*')
                    .eq('id', sparePartData.brand_id)
                    .single()
                : { data: null, error: null };
              
              if (error) {
                console.error('Error fetching brand:', error);
                return { data: { id: sparePartData.brand_id, name: 'Unknown Brand' } };
              }
              return { data };
            } catch (err) {
              console.error('Exception fetching brand:', err);
              return { data: { id: sparePartData.brand_id, name: 'Unknown Brand' } };
            }
          })(),
          
          // Fetch model with error handling
          (async () => {
            try {
              const { data, error } = sparePartData.model_id
                ? await supabase
                    .from('models')
                    .select('*')
                    .eq('id', sparePartData.model_id)
                    .single()
                : { data: null, error: null };
              
              if (error) {
                console.error('Error fetching model:', error);
                return { data: sparePartData.model_id ? { id: sparePartData.model_id, name: 'Unknown Model' } : null };
              }
              return { data };
            } catch (err) {
              console.error('Exception fetching model:', err);
              return { data: sparePartData.model_id ? { id: sparePartData.model_id, name: 'Unknown Model' } : null };
            }
          })(),
          
          // Fetch category with error handling and fallback
          (async () => {
            if (!sparePartData.category_id) return { data: null };
            
            try {
              // First try with the correct table name
              const { data, error } = await supabase
                .from('spare_part_categories')  // Updated table name
                .select('*')
                .eq('id', sparePartData.category_id)
                .single();
              
              if (!error && data) return { data };
              
              // If not found, try with the old table name as fallback
              console.log('Category not found in spare_part_categories, trying categories table...');
              const fallback = await supabase
                .from('categories')
                .select('*')
                .eq('id', sparePartData.category_id)
                .single();
              
              if (!fallback.error && fallback.data) return fallback;
              
              console.error('Error fetching category:', error || fallback.error);
              return { 
                data: { 
                  id: sparePartData.category_id, 
                  name: 'Uncategorized', 
                  name_en: 'Uncategorized',
                  name_ar: 'غير مصنف'
                } 
              };
              
            } catch (err) {
              console.error('Exception fetching category:', err);
              return { 
                data: { 
                  id: sparePartData.category_id, 
                  name: 'Uncategorized', 
                  name_en: 'Uncategorized',
                  name_ar: 'غير مصنف'
                } 
              };
            }
          })(),
          

          // Fetch city data if city_id exists
          (async () => {
            try {
              if (!sparePartData.city_id) return { data: null };
              const { data, error } = await supabase
                .from('cities')
                .select('id, name, name_ar')
                .eq('id', sparePartData.city_id)
                .single<City>();
              
              if (error) throw error;
              return { data };
            } catch (err) {
              console.error('Error fetching city:', err);
              return { data: null };
            }
          })(),

          // Fetch user profile data
          (async () => {
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sparePartData.user_id)
                .single();
              
              if (error) throw error;
              return { data };
            } catch (err) {
              console.error('Error fetching user profile:', err);
              // Return a default user profile if there's an error
              return {
                data: {
                  id: sparePartData.user_id,
                  full_name: 'Unknown User',
                  email: '',
                  phone_number: '',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as UserProfile
              };
            }
          })()
        ];

        // Process the results
        const [
          imagesResult, 
          brandResult, 
          modelResult, 
          categoryResult, 
          cityResult, 
          profileResult
        ] = await Promise.all(queries);

        // Ensure we have properly typed images array
        const images: SparePartImage[] = Array.isArray(imagesResult?.data) 
          ? imagesResult.data.filter((img: any): img is SparePartImage => 
              img && 
              typeof img.id === 'string' && 
              typeof img.url === 'string' &&
              typeof img.is_primary === 'boolean' &&
              typeof img.spare_part_id === 'string' &&
              typeof img.created_at === 'string'
            )
          : [];

        // Ensure we have at least one primary image
        if (images.length > 0 && !images.some(img => img.is_primary)) {
          // If no primary image, set the first one as primary
          images[0] = { ...images[0], is_primary: true };
        }

        // Combine all the data into a single spare part object
        const completeSparePart: SparePart = {
          ...sparePartData,
          brand: brandResult.data,
          model: modelResult.data,
          category: categoryResult.data,
          city: cityResult.data,
          user: profileResult.data as UserProfile,
          images
        };

        setSparePart(completeSparePart);
      } catch (error) {
        console.error('Error fetching spare part:', error);
        setError('Failed to load spare part details');
        showToast('Failed to load spare part details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSparePart();
    }
  }, [params.id]);

  const fetchComments = async () => {
      try {
        const { data: allComments, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              email,
              phone_number
            )
          `)
          .eq('spare_part_id', params.id)
          .order('created_at', { ascending: false });
  
        if (error) throw error;
  
        // Organize comments into a hierarchy
        const parentComments: CommentWithReplies[] = [];
        const replyComments = new Map<number, CommentWithReplies[]>();
  
        // First, separate parent comments and replies
        allComments.forEach(comment => {
          if (comment.parent_id) {
            if (!replyComments.has(comment.parent_id)) {
              replyComments.set(comment.parent_id, []);
            }
            replyComments.get(comment.parent_id)?.push(comment);
          } else {
            parentComments.push({ ...comment, replies: [] });
          }
        });
  
        // Then, attach replies to their parent comments
        parentComments.forEach(comment => {
          comment.replies = replyComments.get(comment.id) || [];
          // Sort replies by created_at
          comment.replies.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
  
        setComments(parentComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
  
    useEffect(() => {
      if (params.id) {
        fetchComments();
      }
    }, [params.id]);
    
    const handleReply = (comment: CommentWithReplies) => {
      setReplyTo(comment);
      // Focus the comment input and scroll it into view
      const commentInput = document.getElementById('comment-input');
      if (commentInput) {
        commentInput.focus();
        commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
  
    const handleSubmitComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (!newComment.trim()) return;
    
      setIsSubmittingComment(true);
      try {
        // Change this line to use spare_part_id instead of car_id
        const { data: comment, error } = await supabase
          .from('comments')
          .insert([
            {
              spare_part_id: sparePart?.id || 0,  // Changed from car_id to spare_part_id
              user_id: user.id,
              content: newComment.trim(),
              parent_id: replyTo?.id || null,
            }
          ])
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              email,
              phone_number
            )
          `)
          .single();
    
        if (error) throw error;
    
        // Update comments state based on whether it's a reply or new comment
        if (replyTo) {
          setComments(prevComments => 
            prevComments.map(parentComment => {
              if (parentComment.id === replyTo.id) {
                return {
                  ...parentComment,
                  replies: [...(parentComment.replies || []), comment].sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )
                };
              }
              return parentComment;
            })
          );
        } else {
          setComments(prevComments => [{
            ...comment,
            replies: []
          }, ...prevComments]);
        }
    
        setNewComment('');
        setReplyTo(null);
      } catch (error) {
        console.error('Error submitting comment:', error);
      } finally {
        setIsSubmittingComment(false);
      }
    };
  
    const handleEditComment = (comment: CommentWithReplies) => {
      setEditingComment(comment);
      setEditContent(comment.content);
    };
  
    const handleCancelEdit = () => {
      setEditingComment(null);
      setEditContent('');
    };
  
    const handleSaveEdit = async () => {
      if (!editingComment || !editContent.trim()) return;
    
      setIsSubmittingEdit(true);
      try {
        const { data: updatedComment, error } = await supabase
          .from('comments')
          .update({ 
            content: editContent.trim(),
            updated_at: new Date().toISOString()  // Update comment's updated_at
          })
          .eq('id', editingComment.id)
          .select(`
            *,
            user:user_id (
              id,
              full_name,
              email,
              phone_number
            )
          `)
          .single();
    
        if (error) throw error;
    
        // Update spare part's updated_at
        const { error: sparePartError } = await supabase
          .from('spare_parts')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', sparePart?.id);
    
        if (sparePartError) {
          console.error('Error updating spare part timestamp:', sparePartError);
        }
    
        // Update comments state
        if (editingComment.parent_id) {
          setComments(prevComments => 
            prevComments.map(parentComment => {
              if (parentComment.id === editingComment.parent_id) {
                return {
                  ...parentComment,
                  replies: parentComment.replies?.map(reply =>
                    reply.id === editingComment.id ? updatedComment : reply
                  ) || []
                };
              }
              return parentComment;
            })
          );
        } else {
          setComments(prevComments =>
            prevComments.map(comment =>
              comment.id === editingComment.id
                ? { ...updatedComment, replies: comment.replies }
                : comment
            )
          );
        }
    
        setEditingComment(null);
        setEditContent('');
        toast.success(t('spareParts.commentUpdated'));
      } catch (error) {
        console.error('Error updating comment:', error);
      } finally {
        setIsSubmittingEdit(false);
      }
    };
  
    const handleDeleteComment = async (comment: CommentWithReplies) => {
      if (!window.confirm(t('car.details.deleteConfirm'))) return;
  
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', comment.id);
  
        if (error) throw error;
  
        // Update comments state
        if (comment.parent_id) {
          setComments(prevComments => 
            prevComments.map(parentComment => {
              if (parentComment.id === comment.parent_id) {
                return {
                  ...parentComment,
                  replies: parentComment.replies?.filter(reply => reply.id !== comment.id) || []
                };
              }
              return parentComment;
            })
          );
        } else {
          setComments(prevComments =>
            prevComments.filter(c => c.id !== comment.id)
          );
        }
  
        toast.success(t('spareParts.commentDeleted'));
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsDeleting(false);
      }
    };
    
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSendMessage = () => {
    showToast(
      currentLanguage === 'ar' 
        ? t('spareParts.messageSentSuccessfully') 
        : t('spareParts.messageSentSuccessfully'), 
      'success'
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()} 
          className="mb-6 inline-flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('spareParts.backToListings')}
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="h-[400px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-20 bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 w-3/4 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 w-1/2 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-full rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-5/6 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-4/5 rounded animate-pulse"></div>
            <div className="pt-4">
              <div className="h-12 bg-blue-200 w-48 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sparePart) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Spare Part Not Found</h2>
        <button 
          onClick={() => router.push('/spare-parts')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          {t('spareParts.backToListings')}
        </button>
      </div>
    );
  }

  const currentFullImage = sparePart.images?.[fullImageIndex] || null;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()} 
        className="mb-6 inline-flex items-center text-maroon-600 hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> {t('spareParts.backToListings')}
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image Section */}
          <div className="relative w-full h-44 md:h-96 lg:h-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4">
            {sparePart?.images && sparePart.images.length > 0 ? (
              <>
                <img
                  src={sparePart.images[currentImageIndex]?.url}
                  alt={sparePart.title}
                  className={`w-full h-full object-cover cursor-zoom-in ${sparePart.status !== 'approved' ? 'opacity-70' : ''}`}
                  onClick={() => openFullImage(currentImageIndex)}
                />
                {sparePart.status && sparePart.status !== 'approved' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`text-4xl font-bold transform rotate-[-15deg] px-6 py-3 rounded-lg ${
                      sparePart.status === 'sold' ? 'bg-green-600/90 text-white' :
                      sparePart.status === 'expired' ? 'bg-amber-600/90 text-white' :
                      sparePart.status === 'hidden' ? 'bg-gray-800/90 text-white' :
                      'text-qatar-maroon bg-white/80 dark:bg-black/70'
                    }`}>
                      {sparePart.status.toUpperCase()}
                    </div>
                  </div>
                )}
                {(sparePart.featured || sparePart.is_featured) && (
                  <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon/90 text-white text-xs font-medium rounded-lg shadow-lg">
                    Featured
                  </div>
                )}
                {sparePart.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {sparePart.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImage(index);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'w-4 bg-qatar-maroon' 
                            : 'w-1.5 bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                {sparePart.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>
          
          {/* Thumbnail Grid */}
          {sparePart?.images && sparePart.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {sparePart.images.map((image, index) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.url}
                    alt={`${sparePart.title} - ${index + 1}`}
                    className={`w-full aspect-[4/3] object-cover rounded-lg cursor-pointer transition-all duration-200 ${
                      currentImageIndex === index 
                        ? 'ring-2 ring-qatar-maroon scale-105' 
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setCurrentImage(index);
                      setFullImageIndex(index);
                    }}
                  />
                  
                </div>
              ))}
            </div>
          )}
          
          {/* Full Screen Image Viewer */}
          {showFullImage && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={closeFullImage}
                  className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Navigation Buttons */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                
                <div 
                  className="relative w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={handleNextImage}
                >
                  <img
                    src={sparePart.images[fullImageIndex]?.url}
                    alt={`${sparePart.title} - Full View`}
                    className={`max-h-[90vh] max-w-[90vw] object-contain ${sparePart.status !== 'approved' ? 'opacity-70' : ''}`}
                  />
                  {sparePart.status && sparePart.status !== 'approved' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`text-5xl font-bold transform rotate-[-15deg] px-8 py-4 rounded-lg ${
                        sparePart.status === 'sold' ? 'bg-green-600/90 text-white' :
                        sparePart.status === 'expired' ? 'bg-amber-600/90 text-white' :
                        sparePart.status === 'hidden' ? 'bg-gray-800/90 text-white' :
                        'text-qatar-maroon bg-white/80 dark:bg-black/70'
                      }`}>
                        {sparePart.status.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {fullImageIndex + 1} / {sparePart?.images?.length}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center w-full mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {currentLanguage === 'ar' && sparePart.name_ar ? sparePart.name_ar : sparePart.title}
            </h1>
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {sparePart.price.toLocaleString()} {t(`${sparePart.currency}`)}
              {sparePart.is_negotiable && (
                <div className="text-sm text-muted-foreground text-right">{t('spareParts.isNegotiable')}</div>
              )}
            </div>
          </div>
          <div>
            
            <div>
              {/* Part Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                
                
                {/* Category Box */}
                {sparePart.category && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.category')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.category as WithName)
                        : (sparePart.category as any)?.name_en || getName(sparePart.category as WithName)}
                    </div>
                  </div>
                )}
                
                {/* Part Type Box */}
                {sparePart.part_type && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.partType')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(`spareParts.partType.${sparePart.part_type}`)}
                    </div>
                  </div>
                )}

                {/* Condition Box */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('spareParts.details.condition')}
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(`spareParts.condition.${sparePart.condition}`)}
                    </span>
                  </div>
                </div>
                
                
                
                {/* city Box */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('spareParts.details.city')}
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sparePart.city?.name}
                    </span>
                  </div>
                </div>
                {/* Brand Box */}
                {sparePart.brand && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.brand')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.brand as WithName)
                        : getName(sparePart.brand as WithName)}
                    </div>
                  </div>
                )}
                
                {/* Model Box */}
                {sparePart.model && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.model')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.model as WithName)
                        : getName(sparePart.model as WithName)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="mb-6">
            <div className="prose max-w-none mt-4">
              <p 
                dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                className={`text-gray-700 dark:text-gray-300 ${currentLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLanguage === 'ar' && sparePart.description_ar 
                  ? sparePart.description_ar 
                  : sparePart.description}
              </p>
            </div>
          </div>
          
         
          {/* Owner Info */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-12 h-12 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-900 dark:text-white">{sparePart.user?.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sparePart.user?.role === 'dealer' ? t('car.details.dealer') : t('car.details.privateSeller')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('car.details.listed')} {formatDate(sparePart.created_at, 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="ml-auto">
                {sparePart.user?.phone_number && (
                  <a
                    href={`tel:${sparePart.user.phone_number}`}
                    className="flex items-center space-x-2 text-qatar-maroon hover:text-qatar-maroon/80"
                    dir="ltr"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="font-ltr" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{sparePart.user?.phone_number.replace(/^(\+\d{1,3})(\d+)/, '$1-$2')}</span>
                  </a>
                )}
              </div>
            </div>
           {/* Comments */}
           <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('car.details.comments')}</h2>
              <div className="space-y-4">
                {user ? (
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {t('car.details.replyingTo')} {replyTo.user.full_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    <div>
                      <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? t('car.details.writeReply') : t('car.details.writeComment')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="px-6 py-2 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 transition-colors flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
                      >
                        {isSubmittingComment && (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {replyTo ? t('car.details.postReply') : t('car.details.postComment')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{t('car.details.loginToComment')}</p>
                    <button
                      onClick={() => router.push('/login')}
                      className="text-qatar-maroon hover:text-qatar-maroon/80"
                    >
                      {t('common.login')}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    {/* Parent Comment */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-qatar-maroon">
                              {comment.user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{comment.user.full_name}</div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-QA' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {user && (
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {user.id === comment.user_id && (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-sm text-gray-500 hover:text-qatar-maroon flex items-center space-x-1 rtl:space-x-reverse"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>{t('car.details.editComment')}</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment)}
                                  className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1 rtl:space-x-reverse"
                                  disabled={isDeleting}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>{t('car.details.deleteComment')}</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleReply(comment)}
                              className="text-sm text-qatar-maroon hover:text-qatar-maroon/80 flex items-center space-x-1 rtl:space-x-reverse"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span>{t('car.details.reply')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                      {editingComment?.id === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {t('car.details.cancelEdit')}
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSubmittingEdit}
                              className="px-3 py-1 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 text-sm flex items-center space-x-1 rtl:space-x-reverse disabled:opacity-50"
                            >
                              {isSubmittingEdit && (
                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {t('car.details.saveEdit')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{comment.content}</p>
                      )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        {comment.replies.map((reply) => (
                          <div 
                            key={reply.id} 
                            className="p-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-qatar-maroon/20 mr-0 ml-8 rtl:ml-0 rtl:mr-8 relative before:absolute before:top-0 before:h-full before:w-px before:bg-qatar-maroon/10 before:right-auto before:left-[-2px] rtl:before:right-[-2px] rtl:before:left-auto"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <div className="w-8 h-8 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-qatar-maroon">
                                    {reply.user.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{reply.user.full_name}</div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(reply.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-QA' : 'en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              {user && (
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  {user.id === reply.user_id && (
                                    <>
                                      <button
                                        onClick={() => handleEditComment(reply)}
                                        className="text-sm text-gray-500 hover:text-qatar-maroon flex items-center space-x-1 rtl:space-x-reverse"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>{t('car.details.editComment')}</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(reply)}
                                        className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1 rtl:space-x-reverse"
                                        disabled={isDeleting}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>{t('car.details.deleteComment')}</span>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleReply(reply)}
                                    className="text-sm text-qatar-maroon hover:text-qatar-maroon/80 flex items-center space-x-1 rtl:space-x-reverse"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    <span>{t('car.details.reply')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            {editingComment?.id === reply.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-qatar-maroon focus:border-qatar-maroon bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  rows={3}
                                />
                                <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    {t('car.details.cancelEdit')}
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={isSubmittingEdit}
                                    className="px-3 py-1 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon/90 text-sm flex items-center space-x-1 rtl:space-x-reverse disabled:opacity-50"
                                  >
                                    {isSubmittingEdit && (
                                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    )}
                                    {t('car.details.saveEdit')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 dark:text-gray-300 mt-2">{reply.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          
          {/* Similar Items */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t('spareParts.similarSpareParts')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Similar items would be mapped here */}
              <div className="text-center py-8 text-muted-foreground">
                {t('spareParts.similarSparePartsPlaceholder')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>     
  );
}
