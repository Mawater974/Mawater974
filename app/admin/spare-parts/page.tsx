"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Base types for related data
type Brand = { id: string; name: string };
type Model = { id: string; name: string };
type Category = { id: string; name: string };
type City = { id: string; name: string };
type Profile = { id: string; email: string; phone: string };
type SparePartImage = { spare_part_id: string; url: string; is_primary: boolean };

// Main SparePart type
type SparePart = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  part_type: 'original' | 'aftermarket';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  brand_id: string | null;
  model_id: string | null;
  category_id: string | null;
  city_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  category_name: string | null;
  city_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  images: Array<{ url: string; is_primary: boolean }>;
};

// Database row types
type DatabaseSparePart = {
  id: string;
  title: string;
  title_ar?: string | null;
  description: string;
  description_ar?: string | null;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  part_type?: 'original' | 'aftermarket';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  brand_id: string | null;
  model_id: string | null;
  category_id: string | null;
  city_id: string | null;
};

export default function AdminSparePartsPage() {
  // Initialize state with proper type
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  const fetchSpareParts = async () => {
    try {
      setLoading(true);
      
      // First, get the spare parts with basic info
      const { data: sparePartsData, error: partsError } = await supabase
        .from('spare_parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (partsError) throw partsError;
      if (!sparePartsData) {
        setSpareParts([]);
        return;
      }

      // Get related data in parallel
      const [
        { data: brands },
        { data: models },
        { data: categories },
        { data: cities },
        { data: profiles },
        { data: images }
      ] = await Promise.all([
        supabase.from('brands').select('id, name'),
        supabase.from('car_models').select('id, name'),
        supabase.from('categories').select('id, name'),
        supabase.from('cities').select('id, name'),
        supabase.from('profiles').select('id, email, phone'),
        supabase.from('spare_part_images').select('spare_part_id, url, is_primary')
      ]);

      // Type assertions for the fetched data
      const typedBrands = (brands || []) as Brand[];
      const typedModels = (models || []) as Model[];
      const typedCategories = (categories || []) as Category[];
      const typedCities = (cities || []) as City[];
      const typedProfiles = (profiles || []) as Profile[];
      const typedImages = (images || []) as SparePartImage[];
      const typedSpareParts = sparePartsData as DatabaseSparePart[];

      // Map the data together with proper types
      const formattedData: SparePart[] = typedSpareParts.map(part => {
        // Ensure all required fields have default values
        const sparePart: SparePart = {
          ...part,
          title_ar: part.title_ar || null,
          description_ar: part.description_ar || null,
          part_type: part.part_type || 'original',
          brand_name: typedBrands.find(b => b.id === part.brand_id)?.name || null,
          model_name: typedModels.find(m => m.id === part.model_id)?.name || null,
          category_name: typedCategories.find(c => c.id === part.category_id)?.name || null,
          city_name: typedCities.find(c => c.id === part.city_id)?.name || null,
          user_email: typedProfiles.find(p => p.id === part.user_id)?.email || null,
          user_phone: typedProfiles.find(p => p.id === part.user_id)?.phone || null,
          images: typedImages
            .filter(img => img.spare_part_id === part.id)
            .map(img => ({
              url: img.url,
              is_primary: img.is_primary
            })) || []
        };
        
        return sparePart;
      });

      setSpareParts(formattedData);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast.error('Failed to load spare parts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareParts();
  }, []);

  // Update the status of a spare part
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdating(prev => ({ ...prev, [id]: true }));
      
      const { error } = await supabase
        .from('spare_parts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSpareParts(prev =>
        prev.map(part =>
          part.id === id ? { ...part, status } : part
        )
      );

      toast.success(`Spare part ${status} successfully`);
    } catch (error) {
      console.error(`Error ${status} spare part:`, error);
      toast.error(`Failed to ${status} spare part`);
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const getPartTypeBadge = (type: string) => {
    const baseStyles = 'px-2 py-1 text-xs font-medium rounded';
    
    switch (type) {
      case 'original':
        return <span className={`${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>Original</span>;
      case 'aftermarket':
        return <span className={`${baseStyles} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>Aftermarket</span>;
      default:
        return <span className={`${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseStyles = 'px-2 py-1 text-xs font-medium rounded';
    
    switch (status) {
      case 'approved':
        return <span className={`${baseStyles} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseStyles} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>Rejected</span>;
      default:
        return <span className={`${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600`}>Pending</span>;
    }
  };

  const getConditionBadge = (condition: string) => {
    const baseStyles = 'px-2 py-1 text-xs font-medium rounded';
    
    switch (condition) {
      case 'new':
        return <span className={`${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800`}>New</span>;
      case 'used':
        return <span className={`${baseStyles} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>Used</span>;
      case 'refurbished':
        return <span className={`${baseStyles} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>Refurbished</span>;
      default:
        return <span className={`${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>{condition}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spare Parts Management</h1>
          <p className="text-muted-foreground">
            Review and manage spare parts listings
          </p>
        </div>
        <button 
          onClick={fetchSpareParts} 
          className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title (EN/AR)</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spareParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        {part.images?.find(img => img.is_primary)?.url ? (
                          <img
                            src={part.images.find(img => img.is_primary)?.url}
                            alt={part.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No Image</span>
                          </div>
                        )}
                        <span>{part.title}</span>
                      </div>
                      {part.title_ar && (
                        <div className="text-xs text-muted-foreground text-right" dir="rtl">
                          {part.title_ar}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{part.brand_name || 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">
                        {part.model_name || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{part.category_name || 'N/A'}</TableCell>
                  <TableCell>{getPartTypeBadge(part.part_type || 'original')}</TableCell>
                  <TableCell>${(part.price || 0).toLocaleString()}</TableCell>
                  <TableCell>{getConditionBadge(part.condition)}</TableCell>
                  <TableCell>{getStatusBadge(part.status)}</TableCell>
                  <TableCell>
                    {format(new Date(part.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {part.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(part.id, 'approved')}
                        disabled={updating[part.id]}
                        className={`${buttonStyles} ${buttonVariants.default} ${buttonSizes.sm} h-8 min-w-[80px]`}
                      >
                        {updating[part.id] ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    {part.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(part.id, 'rejected')}
                        disabled={updating[part.id]}
                        className={`${buttonStyles} ${buttonVariants.outline} ${buttonSizes.sm} h-8 min-w-[80px] ml-2`}
                      >
                        {updating[part.id] ? 'Rejecting...' : 'Reject'}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {spareParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No spare parts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}