'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
// Custom button styles to match the design system
const buttonStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'underline-offset-4 hover:underline text-primary',
};

const buttonSizes = {
  default: 'h-10 py-2 px-4',
  sm: 'h-9 px-3 rounded-md',
  lg: 'h-11 px-8 rounded-md',
  icon: 'h-10 w-10',
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';

// Define the status type according to the database enum
type SparePartStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'expired' | 'hidden' | 'archived';

type SparePart = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  price: number;
  status: SparePartStatus;
  created_at: string;
  updated_at?: string;
  user_id: string;
  brand_id: string | null;
  model_id: string | null;
  category_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  category_name: string | null;
  images: Array<{ url: string; is_primary: boolean }>;
};

export default function AdminSparePartsPage() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();
  const supabase = createClient();

  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      
      // Fetch all related data separately to avoid complex joins
      const [
        { data: partsData, error: partsError },
        { data: brandsData, error: brandsError },
        { data: modelsData, error: modelsError },
        { data: categoriesData, error: categoriesError },
        { data: imagesData, error: imagesError },
      ] = await Promise.all([
        supabase
          .from('spare_parts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('brands').select('id, name'),
        supabase.from('models').select('id, name'),
        supabase.from('spare_part_categories').select('id, name_en, name_ar'),
        supabase.from('spare_part_images').select('spare_part_id, url, is_primary')
      ]);

      // Handle errors
      if (partsError) throw partsError;
      if (brandsError) console.error('Error fetching brands:', brandsError);
      if (modelsError) console.error('Error fetching models:', modelsError);
      if (categoriesError) console.error('Error fetching categories:', categoriesError);
      if (imagesError) console.error('Error fetching images:', imagesError);

      if (!partsData) {
        setSpareParts([]);
        return;
      }

      // Create lookup maps for related data
      const brandsMap = new Map((brandsData || []).map(brand => [brand.id, brand]));
      const modelsMap = new Map((modelsData || []).map(model => [model.id, model]));
      const categoriesMap = new Map((categoriesData || []).map(cat => [cat.id, cat]));
      
      // Group images by spare_part_id
      const imagesMap = new Map();
      (imagesData || []).forEach(img => {
        const partId = img.spare_part_id;
        if (!imagesMap.has(partId)) {
          imagesMap.set(partId, []);
        }
        imagesMap.get(partId).push({
          url: img.url,
          is_primary: img.is_primary
        });
      });

      // Combine all data
      const formattedData = partsData.map(part => {
        const brand = part.brand_id ? brandsMap.get(part.brand_id) : null;
        const model = part.model_id ? modelsMap.get(part.model_id) : null;
        const category = part.category_id ? categoriesMap.get(part.category_id) : null;
        
        return {
          id: part.id,
          title: part.title,
          title_ar: part.title_ar || null,
          description: part.description || '',
          description_ar: part.description_ar || null,
          price: part.price || 0,
          status: part.status,
          created_at: part.created_at,
          user_id: part.user_id,
          brand_id: part.brand_id,
          model_id: part.model_id,
          category_id: part.category_id,
          brand_name: brand?.name || null,
          model_name: model?.name || null,
          category_name: category?.name_en || null,
          images: imagesMap.get(part.id) || []
        } as SparePart;
      });

      setSpareParts(formattedData);
    } catch (error) {
      console.error('Error in fetchSpareParts:', error);
      toast.error(`Failed to load spare parts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareParts();
  }, []);

  const updateStatus = async (id: string, status: SparePartStatus) => {
    console.group('updateStatus');
    try {
      console.log('Starting update for part:', id, 'New status:', status);
      setUpdating(prev => ({ ...prev, [id]: true }));

      // First, get the current part data
      const part = spareParts.find(p => p.id === id);
      if (!part) {
        const error = new Error('Part not found in local state');
        console.error('Error:', error);
        throw error;
      }
      console.log('Found part:', part);

      // Log the exact update payload
      const updatePayload = { 
        status,
        updated_at: new Date().toISOString() 
      };
      console.log('Update payload:', updatePayload);

      // Update the status using a direct SQL query
      console.log('Updating status with direct SQL...');
      const { data: updateData, error: updateError } = await supabase.rpc('update_spare_part_status', {
        part_id: id,
        new_status: status
      });

      console.log('Database update response:', { updateData, updateError });
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      // Verify the update was applied
      const { data: verifyData, error: verifyError } = await supabase
        .from('spare_parts')
        .select('status')
        .eq('id', id)
        .single();
        
      console.log('Database verification:', { verifyData, verifyError });
      
      if (verifyError) {
        console.error('Failed to verify update:', verifyError);
        throw verifyError;
      }
      
      // Manually update the local state since we're not getting data back
      setSpareParts(prevParts => 
        prevParts.map(part => 
          part.id === id 
            ? { ...part, status, updated_at: new Date().toISOString() } 
            : part
        )
      );

      // Create a notification for the user
      if (part.user_id) {
        const statusMessages = {
          approved: {
            title_en: 'Spare Part Approved',
            title_ar: 'تمت الموافقة على القطعة',
            message_en: `Your spare part "${part.title}" has been approved.`,
            message_ar: `تمت الموافقة على القطعة "${part.title_ar || part.title}".`
          },
          rejected: {
            title_en: 'Spare Part Rejected',
            title_ar: 'تم رفض القطعة',
            message_en: `Your spare part "${part.title}" has been rejected.`,
            message_ar: `تم رفض القطعة "${part.title_ar || part.title}".`
          },
          pending: {
            title_en: 'Spare Part Status Updated',
            title_ar: 'تم تحديث حالة القطعة',
            message_en: `Your spare part "${part.title}" is now pending review.`,
            message_ar: `القطعة "${part.title_ar || part.title}" قيد المراجعة الآن.`
          }
        };

        const notification = {
          user_id: part.user_id,
          type: `spare_part_${status}`,
          ...statusMessages[status as keyof typeof statusMessages]
        };

        const { error: notifError } = await supabase
          .from('notifications')
          .insert([notification]);

        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          console.log('Notification created successfully');
        }
      }

      toast.success(`Spare part ${status} successfully`);
      
      // Refresh the data from the server to ensure consistency
      console.log('Refreshing data from server...');
      await fetchSpareParts();
      
    } catch (error) {
      console.error('Error in updateStatus:', error);
      toast.error(`Failed to ${status} spare part: ${error.message}`);
    } finally {
      console.log('Cleaning up...');
      setUpdating(prev => ({ ...prev, [id]: false }));
      console.groupEnd();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spare part?')) return;
    
    try {
      setUpdating(prev => ({ ...prev, [id]: true }));
      
      const { error } = await supabase
        .from('spare_parts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSpareParts(prev => prev.filter(part => part.id !== id));
      toast.success('Spare part deleted successfully');
    } catch (error) {
      console.error('Error deleting spare part:', error);
      toast.error('Failed to delete spare part');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts Management</h1>
          <p className="text-muted-foreground">
            Review and manage spare parts listings
          </p>
        </div>
        <button
          onClick={fetchSpareParts}
          disabled={Object.values(updating).some(Boolean)}
          className={`${buttonStyles} ${buttonVariants.outline} ${buttonSizes.sm}`}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${Object.values(updating).some(Boolean) ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spare Parts List</CardTitle>
          <CardDescription>
            {spareParts.length} {spareParts.length === 1 ? 'listing' : 'listings'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spareParts.length > 0 ? (
                  spareParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {part.images?.length > 0 ? (
                            <img
                              src={part.images[0].url}
                              alt={part.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <span className="text-xs text-muted-foreground">No Image</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{part.title}</div>
                            {part.title_ar && (
                              <div className="text-xs text-muted-foreground text-right" dir="rtl">
                                {part.title_ar}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{part.brand_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {part.model_name || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{part.category_name || 'N/A'}</TableCell>
                      <TableCell>
                        {part.price ? `QAR ${part.price.toLocaleString()}` : 'Price on request'}
                      </TableCell>
                      <TableCell>{getStatusBadge(part.status)}</TableCell>
                      <TableCell>
                        {format(new Date(part.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* Show Approve button if not already approved */}
                        {part.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(part.id, 'approved')}
                            disabled={updating[part.id]}
                            className={`${buttonStyles} ${buttonSizes.sm} bg-green-600 text-white hover:bg-green-700`}
                          >
                            {updating[part.id] ? 'Updating...' : 'Approve'}
                          </button>
                        )}
                        
                        {/* Show Reject button if not already rejected */}
                        {part.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(part.id, 'rejected')}
                            disabled={updating[part.id]}
                            className={`${buttonStyles} ${buttonSizes.sm} border border-red-500 text-red-600 hover:bg-red-50`}
                          >
                            {updating[part.id] ? 'Updating...' : part.status === 'approved' ? 'Reject' : 'Reject'}
                          </button>
                        )}
                        
                        {/* Show Pending button if not pending */}
                        {part.status !== 'pending' && part.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(part.id, 'pending')}
                            disabled={updating[part.id]}
                            className={`${buttonStyles} ${buttonSizes.sm} border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50`}
                          >
                            {updating[part.id] ? 'Updating...' : 'Set Pending'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(part.id)}
                          disabled={updating[part.id]}
                          className={`${buttonStyles} ${buttonSizes.sm} ${buttonVariants.destructive}`}
                        >
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No spare parts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
