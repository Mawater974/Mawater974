
import { supabase } from '../supabaseClient';
import { Car, SparePart, Dealership, Brand, Country, Profile, Favorite, Model, City, Comment, ContactMessage, SparePartCategory } from '../types';
import { compressImage } from '../utils/imageOptimizer';

// Helper for Image Optimization
export const getOptimizedImageUrl = (url: string, width: number = 500, quality: number = 80): string => {
    if (!url) return '';
    if (url.includes('supabase.co')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
    }
    return url;
};

// UUID Generator Polyfill
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Fallback countries with new data
export const FALLBACK_COUNTRIES: Country[] = [
    { id: 1, name: 'Qatar', name_ar: 'قطر', code: 'qa', currency_code: 'QAR', phone_code: '+974' },
    { id: 2, name: 'Saudi Arabia', name_ar: 'السعودية', code: 'sa', currency_code: 'SAR', phone_code: '+966' },
    { id: 3, name: 'UAE', name_ar: 'الإمارات', code: 'ae', currency_code: 'AED', phone_code: '+971' },
    { id: 4, name: 'Kuwait', name_ar: 'الكويت', code: 'kw', currency_code: 'KWD', phone_code: '+965' },
    { id: 5, name: 'Syria', name_ar: 'سوريا', code: 'sy', currency_code: 'SYP', phone_code: '+963' },
    { id: 7, name: 'Egypt', name_ar: 'مصر', code: 'eg', currency_code: 'EGP', phone_code: '+20' },
    { id: 8, name: 'Oman', name_ar: 'عمان', code: 'om', currency_code: 'OMR', phone_code: '+968' },
    { id: 9, name: 'Bahrain', name_ar: 'بحرين', code: 'bh', currency_code: 'BHD', phone_code: '+973' },
];

export const getCountries = async (): Promise<Country[]> => {
    const { data, error } = await supabase.from('countries').select('*');
    if (error || !data || data.length === 0) {
        console.warn('Using fallback countries data due to error or empty result:', error);
        return FALLBACK_COUNTRIES;
    }

    // Normalize country codes to lowercase to ensure URL consistency
    return data.map((c: any) => ({
        ...c,
        code: c.code ? c.code.toLowerCase() : ''
    })) as Country[];
};

export const getCarById = async (id: string): Promise<Car | null> => {
    const { data, error } = await supabase
        .from('cars')
        .select(`
      *,
      brands (name, name_ar),
      models (name, name_ar),
      cities (name, name_ar),
      countries (name, name_ar, currency_code),
      car_images (id, image_url, thumbnail_url, is_main),
      profiles (*)
    `)
        .eq('id', id)
        .order('id', { foreignTable: 'car_images', ascending: true })
        .single();

    if (error) {
        console.error('Error fetching car details:', error);
        return null;
    }

    return data as any;
};

export const getSimilarCars = async (currentId: number, brandId: number, countryId?: number): Promise<Car[]> => {
    let query = supabase
        .from('cars')
        .select(`
          *,
          brands (name, name_ar),
          models (name, name_ar),
          cities (name, name_ar),
          countries (name, name_ar, currency_code),
          car_images (image_url, thumbnail_url, is_main),
          profiles (*)
        `)
        .eq('status', 'approved')
        .eq('brand_id', brandId)
        .neq('id', currentId);

    if (countryId) {
        query = query.eq('country_id', countryId);
    }

    query = query.order('is_featured', { ascending: false }) // Featured first
        .order('created_at', { ascending: false })
        .limit(10);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching similar cars:', error);
        return [];
    }
    return data as any[];
};

export const getFeaturedCars = async (countryId?: number | null): Promise<Car[]> => {
    let query = supabase
        .from('cars')
        .select(`
      *,
      brands (name, name_ar),
      models (name, name_ar),
      cities (name, name_ar),
      countries (name, name_ar, currency_code),
      car_images (image_url, thumbnail_url, is_main)
    `)
        .eq('is_featured', true)
        .eq('status', 'approved');

    if (countryId) {
        query = query.eq('country_id', countryId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query.limit(4);

    if (error) {
        console.error('Error fetching featured cars:', error);
        return [];
    }
    return data as any[];
};

export interface CarsResponse {
    data: Car[];
    count: number;
}

export type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc';

export interface CarFilters {
    brandId?: number | null;
    modelId?: number | null;
    countryId?: number | null;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    searchQuery?: string;
    status?: string;
    isRental?: boolean;
    bodyType?: string;
    fuelType?: string;
    gearboxType?: string;
    condition?: string;
    ignoreFeatured?: boolean; // New Flag to disable featured sorting priority
}

export const getCars = async (
    filters: CarFilters,
    page: number = 1,
    limit: number = 12,
    sortBy: SortOption = 'newest'
): Promise<CarsResponse> => {
    let query = supabase
        .from('cars')
        .select(`
      *,
      brands (name, name_ar),
      models (name, name_ar),
      cities (name, name_ar),
      countries (name, name_ar, currency_code),
      car_images (image_url, thumbnail_url, is_main),
      profiles (*)
    `, { count: 'exact' });

    if (filters.status) {
        if (filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
    } else {
        query = query.eq('status', 'approved');
    }

    if (filters.isRental) {
        query = query.ilike('description', '%rental%');
    }

    if (filters.brandId) query = query.eq('brand_id', filters.brandId);
    if (filters.modelId) query = query.eq('model_id', filters.modelId);
    if (filters.countryId) query = query.eq('country_id', filters.countryId);

    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

    if (filters.minYear) query = query.gte('year', filters.minYear);
    if (filters.maxYear) query = query.lte('year', filters.maxYear);

    if (filters.searchQuery) {
        const q = filters.searchQuery.trim();

        // Fetch matching Brands and Models IDs first to enable multi-lingual/relation search
        const [{ data: brandHits }, { data: modelHits }] = await Promise.all([
            supabase.from('brands').select('id').or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`),
            supabase.from('models').select('id').or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`)
        ]);

        const brandIds = brandHits?.map(b => b.id).join(',');
        const modelIds = modelHits?.map(m => m.id).join(',');

        let orConditions = [
            `description.ilike.%${q}%`,
            `exact_model.ilike.%${q}%`
        ];

        if (brandIds && brandIds.length > 0) {
            orConditions.push(`brand_id.in.(${brandIds})`);
        }
        if (modelIds && modelIds.length > 0) {
            orConditions.push(`model_id.in.(${modelIds})`);
        }

        query = query.or(orConditions.join(','));
    }

    if (filters.bodyType) query = query.eq('body_type', filters.bodyType);
    if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
    if (filters.gearboxType) query = query.eq('gearbox_type', filters.gearboxType);
    if (filters.condition) query = query.eq('condition', filters.condition);

    // Apply default featured ordering unless disabled
    if (!filters.ignoreFeatured) {
        query = query.order('is_featured', { ascending: false });
    }

    switch (sortBy) {
        case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
        case 'mileage_asc':
            query = query.order('mileage', { ascending: true });
            break;
        case 'year_desc':
            query = query.order('year', { ascending: false });
            break;
        case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
        console.error('Error fetching cars:', error);
        return { data: [], count: 0 };
    }
    return { data: data as any[], count: count || 0 };
};

export const getUserCars = async (userId: string): Promise<Car[]> => {
    const { data, error } = await supabase
        .from('cars')
        .select(`
      *,
      brands (name, name_ar),
      models (name, name_ar),
      cities (name, name_ar),
      countries (name, name_ar, currency_code),
      car_images (id, image_url, thumbnail_url, is_main)
    `)
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user cars:', error);
        return [];
    }
    return data as any[];
};

export const getUserSpareParts = async (userId: string): Promise<SparePart[]> => {
    const { data, error } = await supabase
        .from('spare_parts')
        .select(`
      *,
      brands (*),
      countries (*),
      spare_part_images (*)
    `)
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user spare parts:', error);
        return [];
    }
    return data as any[];
};

// ... Rest of the file unchanged
export const getBrands = async (): Promise<Brand[]> => {
    const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
    if (error) return [];
    return data as Brand[];
};

export const createBrand = async (brand: Partial<Brand>): Promise<Brand | null> => {
    const { data, error } = await supabase.from('brands').insert([brand]).select().single();
    if (error) {
        console.error("Error creating brand", error);
        return null;
    }
    return data as Brand;
};

export const deleteBrand = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) {
        console.error("Error deleting brand", error);
        return false;
    }
    return true;
};

export const getModels = async (brandId: number): Promise<Model[]> => {
    const { data, error } = await supabase.from('models').select('*').eq('brand_id', brandId).order('name', { ascending: true });
    if (error) return [];
    return data as Model[];
};

export const createModel = async (model: Partial<Model>): Promise<Model | null> => {
    const { data, error } = await supabase.from('models').insert([model]).select().single();
    if (error) {
        console.error("Error creating model", error);
        return null;
    }
    return data as Model;
};

export const deleteModel = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('models').delete().eq('id', id);
    if (error) {
        console.error("Error deleting model", error);
        return false;
    }
    return true;
};

export const getCities = async (countryId: number): Promise<City[]> => {
    const { data, error } = await supabase.from('cities').select('*').eq('country_id', countryId);
    if (error) return [];
    return data as City[];
};

export const getSparePartCategories = async (): Promise<SparePartCategory[]> => {
    const { data, error } = await supabase.from('spare_part_categories').select('*').order('name_en', { ascending: true });
    if (error) return [];
    return data as SparePartCategory[];
};

export const getSpareParts = async (search?: string): Promise<SparePart[]> => {
    let query = supabase
        .from('spare_parts')
        .select(`
      *,
      brands (*),
      models (*),
      cities (*),
      countries (*),
      spare_part_categories (*),
      spare_part_images (*),
      profiles (*)
    `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (search) {
        const q = search.trim();
        const [{ data: brandHits }, { data: modelHits }] = await Promise.all([
            supabase.from('brands').select('id').or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`),
            supabase.from('models').select('id').or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`)
        ]);

        const brandIds = brandHits?.map(b => b.id).join(',');
        const modelIds = modelHits?.map(m => m.id).join(',');

        let orParts = [
            `title.ilike.%${q}%`,
            `description.ilike.%${q}%`
        ];

        if (brandIds && brandIds.length > 0) orParts.push(`brand_id.in.(${brandIds})`);
        if (modelIds && modelIds.length > 0) orParts.push(`model_id.in.(${modelIds})`);

        query = query.or(orParts.join(','));
    }

    const { data, error } = await query.limit(20);

    if (error) {
        console.error('Error fetching spare parts:', error);
        return [];
    }
    return data as any[];
};

export const getSimilarSpareParts = async (currentId: string, categoryId: number, countryId?: number): Promise<SparePart[]> => {
    let query = supabase
        .from('spare_parts')
        .select(`
            *,
            brands (*),
            models (*),
            cities (*),
            countries (*),
            spare_part_categories (*),
            spare_part_images (*),
            profiles (*)
        `)
        .eq('status', 'approved')
        .eq('category_id', categoryId)
        .neq('id', currentId);

    if (countryId) {
        query = query.eq('country_id', countryId);
    }

    query = query.order('is_featured', { ascending: false }) // Featured first
        .order('created_at', { ascending: false })
        .limit(10);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching similar spare parts:', error);
        return [];
    }
    return data as any[];
};

export const getSparePartById = async (id: string): Promise<SparePart | null> => {
    const { data, error } = await supabase
        .from('spare_parts')
        .select(`
            *,
            brands (*),
            models (*),
            cities (*),
            countries (*),
            spare_part_categories (*),
            spare_part_images (*),
            profiles (*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching spare part details:', JSON.stringify(error, null, 2));
        return null;
    }

    // Sort images manually in JS to avoid Supabase 400 Bad Request on nested sorting
    if (data.spare_part_images && Array.isArray(data.spare_part_images)) {
        data.spare_part_images.sort((a: any, b: any) => {
            // Sort by is_primary first (true comes first)
            if (a.is_primary === b.is_primary) return 0;
            return a.is_primary ? -1 : 1;
        });
    }

    return data as any;
};

export type DealerSortOption = 'featured' | 'newest' | 'name_asc';

export const getDealerships = async (
    type: string = 'showroom',
    countryId?: number | null,
    sortBy: DealerSortOption = 'featured',
    status: string = 'approved' // Default to approved, but allows 'all'
): Promise<Dealership[]> => {
    let query = supabase.from('dealerships').select(`
    *,
    cities (name, name_ar),
    countries (name, name_ar, code)
  `);

    if (status !== 'all') {
        query = query.eq('status', status);
    }

    if (countryId) {
        query = query.eq('country_id', countryId);
    }

    // Filter by type if not 'all'
    if (type !== 'all') {
        query = query.eq('dealership_type', type);
    }

    switch (sortBy) {
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        case 'name_asc':
            query = query.order('business_name', { ascending: true });
            break;
        case 'featured':
        default:
            query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
            break;
    }

    // Increased limit to prevent pending dealers from being hidden if there are many entries
    const { data, error } = await query.limit(200);
    if (error) {
        console.error('Error fetching dealerships:', error);
        return [];
    }
    return data as any[];
};

export const getDealershipById = async (id: number): Promise<Dealership | null> => {
    const { data, error } = await supabase.from('dealerships')
        .select(`
            *,
            cities (name, name_ar),
            countries (name, name_ar)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data as any;
};

// NEW FUNCTION to find dealership by user_id
export const getDealershipByUserId = async (userId: string): Promise<Dealership | null> => {
    const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return data as Dealership;
};

export const createDealership = async (dealershipData: Partial<Dealership>): Promise<Dealership | null> => {
    const { data, error } = await supabase
        .from('dealerships')
        .insert([dealershipData])
        .select()
        .single();

    if (error) {
        console.error("Error creating dealership", error);
        return null;
    }
    return data as Dealership;
};

export const updateDealership = async (id: number, updates: Partial<Dealership>): Promise<boolean> => {
    const { error } = await supabase
        .from('dealerships')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error("Error updating dealership", error);
        return false;
    }
    return true;
};

export const updateDealerStatus = async (dealerId: number, status: 'approved' | 'pending' | 'rejected') => {
    // 1. Update Dealership Status
    const { data: dealer, error } = await supabase
        .from('dealerships')
        .update({ status })
        .eq('id', dealerId)
        .select()
        .single();

    if (error || !dealer) {
        console.error("Error updating dealer status", error);
        return false;
    }

    // 2. Sync User Role
    if (dealer.user_id) {
        // Fetch current profile to avoid overwriting Admin role
        const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', dealer.user_id)
            .single();

        if (fetchError) {
            console.error("Error fetching user profile for role sync", fetchError);
            return true; // Return true because dealership status was updated successfully at least
        }

        // If user is Admin, do not change their role regardless of dealership status
        if (currentProfile?.role === 'admin') {
            return true;
        }

        // Determine new role based on dealership status
        // Use 'normal_user' as the base role based on DB schema default
        let newRole = 'normal_user';

        if (status === 'approved') {
            newRole = 'dealer';
        }

        // Only perform update if the role is actually changing
        if (currentProfile?.role !== newRole) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', dealer.user_id);

            if (profileError) {
                console.error("Error syncing user role:", profileError);
                // Alert visible to the admin triggering this action
                alert(`Dealership status updated to '${status}', but failed to update User Role to '${newRole}'. \n\nPossible reasons:\n1. 'normal_user' or 'dealer' is not in the 'user_role' ENUM.\n2. RLS Policies prevent you from updating other users.\n3. Check console for details.`);
            } else {
                console.log(`User ${dealer.user_id} role updated to ${newRole}`);
            }
        }
    }

    return true;
};

export const uploadShowroomLogo = async (file: File): Promise<string | null> => {
    // Force webp extension to match compressImage output
    const fileExt = 'webp';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `logo-${timestamp}-${randomSuffix}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('showroom-logos')
        .upload(fileName, file, {
            upsert: true,
            contentType: 'image/webp'
        });

    if (error) {
        console.error('Upload error', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('showroom-logos')
        .getPublicUrl(fileName);

    return publicUrl;
};

export const getDealershipCars = async (userId: string): Promise<Car[]> => {
    const { data, error } = await supabase.from('cars')
        .select(`
            *,
            brands (name, name_ar),
            models (name, name_ar),
            cities (name, name_ar),
            countries (name, name_ar, currency_code),
            car_images (image_url, thumbnail_url, is_main)
        `)
        .eq('user_id', userId)
        .neq('status', 'archived') // Returns pending, rejected, approved, and sold. Only archived are hidden.
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as any[];
};

export const getServices = async (): Promise<Dealership[]> => {
    const { data, error } = await supabase
        .from('dealerships')
        .select('*')
        .eq('business_type', 'service')
        .eq('status', 'approved')
        .limit(20);

    if (error) return [];
    return data as Dealership[];
};

export const getComments = async (entityId: number | string, entityType: 'car' | 'part'): Promise<Comment[]> => {
    let query = supabase
        .from('comments')
        .select(`*, profiles (*)`) // Wildcard to prevent column error
        .order('created_at', { ascending: true });

    if (entityType === 'car') {
        query = query.eq('car_id', entityId);
    } else {
        query = query.eq('spare_part_id', entityId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching comments', error);
        return [];
    }
    return data as any[];
};

export const createComment = async (comment: Partial<Comment>): Promise<Comment | null> => {
    const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select(`*, profiles (*)`) // Wildcard to prevent column error
        .single();

    if (error) {
        console.error('Error creating comment', error);
        return null;
    }
    return data as any;
};

export const deleteComment = async (commentId: number): Promise<boolean> => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    return !error;
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data as Profile;
};

export const createUserProfile = async (profile: Profile): Promise<boolean> => {
    const { id, ...updates } = profile;
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error("Profile update error", error);
        return false;
    }
    return true;
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    return !error;
};

export const getFavorites = async (userId: string): Promise<Favorite[]> => {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
      *,
      cars (
        *,
        brands (name, name_ar),
        models (name, name_ar),
        cities (name, name_ar),
        countries (name, name_ar, currency_code),
        car_images (image_url, is_main)
      ),
      spare_parts (
        *,
        brands (name, name_ar),
        countries (name, name_ar, currency_code),
        spare_part_images (url, is_primary)
      )
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
    return data as any[];
};

export const toggleFavorite = async (userId: string, entityId: number | string, type: 'car' | 'part'): Promise<boolean> => {
    let query = supabase.from('favorites').select('id').eq('user_id', userId);

    if (type === 'car') {
        query = query.eq('car_id', entityId);
    } else {
        query = query.eq('spare_part_id', entityId);
    }

    const { data } = await query.single();

    if (data) {
        const { error } = await supabase.from('favorites').delete().eq('id', data.id);
        return !error;
    } else {
        const payload: any = { user_id: userId };
        if (type === 'car') payload.car_id = entityId;
        else payload.spare_part_id = entityId;

        const { error } = await supabase.from('favorites').insert([payload]);
        return !error;
    }
};

// Updated: Takes direct path string instead of file+folder
export const uploadCarImage = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
        .from('car-images')
        .upload(path, file, {
            upsert: true
        });

    if (error) {
        console.error('Upload error', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(path);

    return publicUrl;
};

// Function for Spare Parts Images
export const uploadSparePartImage = async (file: File, path: string): Promise<string | null> => {
    // Primary bucket: spare-part-images (Updated per request)
    const { data, error } = await supabase.storage
        .from('spare-part-images')
        .upload(path, file, {
            upsert: true
        });

    if (error) {
        console.error('Upload error to spare-part-images', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('spare-part-images')
        .getPublicUrl(path);

    return publicUrl;
};

export const createCar = async (carData: Partial<Car>, images: File[], userId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not authenticated");
        return false;
    }

    const isTransfer = userId !== user.id;
    const insertUserId = isTransfer ? user.id : userId;

    // 1. Create Car Record first to get ID
    const { data: car, error: carError } = await supabase
        .from('cars')
        .insert([{ ...carData, user_id: insertUserId }])
        .select()
        .single();

    if (carError || !car) {
        console.error('Error creating car', carError);
        return false;
    }

    // 2. Upload Images into folder: {carId}/{timestamp}-{random}.webp
    const carId = car.id;

    const imagePromises = images.map(async (file, index) => {
        try {
            // Generate unique base name for this image pair
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const baseName = `${timestamp}-${randomSuffix}`;

            const mainFileName = `${baseName}.webp`;
            const thumbFileName = `${baseName}_thumb.webp`;

            // Generate thumbnail file
            const thumbFile = await compressImage(file, false, true);

            // Upload Main Image to: {carId}/filename.webp
            const mainPath = `${carId}/${mainFileName}`;
            const mainUrl = await uploadCarImage(file, mainPath);

            // Upload Thumbnail to: {carId}/filename_thumb.webp
            const thumbPath = `${carId}/${thumbFileName}`;
            const thumbUrl = await uploadCarImage(thumbFile, thumbPath);

            if (mainUrl) {
                return {
                    car_id: carId,
                    image_url: mainUrl,
                    thumbnail_url: thumbUrl || mainUrl,
                    is_main: index === 0
                };
            }
            return null;
        } catch (e) {
            console.error("Error processing image pair", e);
            return null;
        }
    });

    const uploadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);

    if (uploadedImages.length > 0) {
        const { error: imgError } = await supabase.from('car_images').insert(uploadedImages);
        if (imgError) console.error('Error linking images', imgError);
    }

    if (isTransfer) {
        const { error: transferError } = await supabase
            .from('cars')
            .update({ user_id: userId })
            .eq('id', car.id);

        if (transferError) {
            console.error('Error transferring car ownership', transferError);
        }
    }

    return true;
};

export const createSparePart = async (partData: Partial<SparePart>, images: File[], userId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 1. Create Part
    const { data: part, error: partError } = await supabase
        .from('spare_parts')
        .insert([{ ...partData, user_id: userId }])
        .select()
        .single();

    if (partError || !part) {
        console.error('Error creating spare part', partError);
        return false;
    }

    // 2. Upload Images
    const partId = part.id;
    const imagePromises = images.map(async (file, index) => {
        try {
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const fileName = `${timestamp}-${randomSuffix}.webp`;

            const mainPath = `${partId}/${fileName}`;
            const mainUrl = await uploadSparePartImage(file, mainPath);

            if (mainUrl) {
                return {
                    spare_part_id: partId,
                    url: mainUrl,
                    is_primary: index === 0
                };
            }
            return null;
        } catch (e) {
            console.error("Error processing part image", e);
            return null;
        }
    });

    const uploadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);

    if (uploadedImages.length > 0) {
        const { error: imgError } = await supabase.from('spare_part_images').insert(uploadedImages);
        if (imgError) console.error('Error linking part images', imgError);
    }

    return true;
};

// UPDATE CAR FUNCTION
export const updateCar = async (
    carId: number,
    updates: Partial<Car>,
    newImages: File[],
    deletedImageIds: string[],
    existingImageIdsInOrder: string[], // New param to handle ordering
    isAdmin: boolean = false // Param to check role for status logic
): Promise<boolean> => {

    // 0. Set status to pending if not admin
    const updatePayload = { ...updates };
    if (!isAdmin) {
        updatePayload.status = 'pending';
    }

    // 1. Update Car Fields
    const { error: updateError } = await supabase
        .from('cars')
        .update(updatePayload)
        .eq('id', carId);

    if (updateError) {
        console.error('Error updating car:', updateError);
        return false;
    }

    // 2. Delete Removed Images (DB + Storage)
    if (deletedImageIds.length > 0) {
        // Fetch paths first to delete from storage
        const { data: imagesToDelete } = await supabase
            .from('car_images')
            .select('image_url, thumbnail_url')
            .in('id', deletedImageIds);

        if (imagesToDelete) {
            const pathsToRemove: string[] = [];

            const extractPath = (url: string) => {
                if (!url) return null;
                // Supabase URL format: .../storage/v1/object/public/bucket/path/to/file
                const parts = url.split('/car-images/');
                return parts.length > 1 ? parts[1].split('?')[0] : null;
            };

            imagesToDelete.forEach(img => {
                const mainPath = extractPath(img.image_url);
                const thumbPath = extractPath(img.thumbnail_url);
                if (mainPath) pathsToRemove.push(mainPath);
                if (thumbPath) pathsToRemove.push(thumbPath);
            });

            if (pathsToRemove.length > 0) {
                // Delete from Storage
                await supabase.storage.from('car-images').remove(pathsToRemove);
            }
        }

        // Delete from DB
        const { error: deleteError } = await supabase
            .from('car_images')
            .delete()
            .in('id', deletedImageIds);

        if (deleteError) console.error('Error deleting images from DB:', deleteError);
    }

    // 3. Update 'is_main' for Existing Images based on new order
    await supabase.from('car_images').update({ is_main: false }).eq('car_id', carId);

    // 4. Upload New Images
    if (newImages.length > 0) {
        const imagePromises = newImages.map(async (file, index) => {
            try {
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const baseName = `${timestamp}-${randomSuffix}`;

                const mainFileName = `${baseName}.webp`;
                const thumbFileName = `${baseName}_thumb.webp`;

                const thumbFile = await compressImage(file, false, true);

                const mainPath = `${carId}/${mainFileName}`;
                const mainUrl = await uploadCarImage(file, mainPath);

                const thumbPath = `${carId}/${thumbFileName}`;
                const thumbUrl = await uploadCarImage(thumbFile, thumbPath);

                if (mainUrl) {
                    return {
                        car_id: carId,
                        image_url: mainUrl,
                        thumbnail_url: thumbUrl || mainUrl,
                        is_main: false // Set initially false, we fix specific main below
                    };
                }
                return null;
            } catch (e) {
                console.error("Error processing image pair", e);
                return null;
            }
        });

        const uploadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);

        if (uploadedImages.length > 0) {
            const { error: imgError } = await supabase.from('car_images').insert(uploadedImages);
            if (imgError) console.error('Error linking images', imgError);
        }
    }

    return true;
};

export const updateSparePart = async (
    partId: string,
    updates: Partial<SparePart>,
    newImages: File[],
    deletedImageIds: string[],
    isAdmin: boolean = false
): Promise<boolean> => {
    // 0. Set status to pending if not admin
    const updatePayload = { ...updates };
    if (!isAdmin) {
        updatePayload.status = 'pending';
    }

    // 1. Update Part Fields
    const { error: updateError } = await supabase
        .from('spare_parts')
        .update(updatePayload)
        .eq('id', partId);

    if (updateError) {
        console.error('Error updating part:', updateError);
        return false;
    }

    // 2. Delete Removed Images
    if (deletedImageIds.length > 0) {
        // Fetch paths first
        const { data: imagesToDelete } = await supabase
            .from('spare_part_images')
            .select('url')
            .in('id', deletedImageIds);

        if (imagesToDelete) {
            const pathsToRemove: string[] = [];
            const extractPath = (url: string) => {
                if (!url) return null;
                // Check all possible buckets to support migration
                if (url.includes('/spare-part-images/')) {
                    const parts = url.split('/spare-part-images/');
                    return parts.length > 1 ? parts[1].split('?')[0] : null;
                }
                if (url.includes('/spare-parts/')) {
                    const parts = url.split('/spare-parts/');
                    return parts.length > 1 ? parts[1].split('?')[0] : null;
                }
                if (url.includes('/spare-parts-images/')) {
                    const parts = url.split('/spare-parts-images/');
                    return parts.length > 1 ? parts[1].split('?')[0] : null;
                }
                return null;
            };

            imagesToDelete.forEach(img => {
                const p = extractPath(img.url);
                if (p) pathsToRemove.push(p);
            });

            if (pathsToRemove.length > 0) {
                // Try removing from all to be safe
                await supabase.storage.from('spare-part-images').remove(pathsToRemove);
                await supabase.storage.from('spare-parts').remove(pathsToRemove);
                await supabase.storage.from('spare-parts-images').remove(pathsToRemove);
            }
        }

        const { error: deleteError } = await supabase
            .from('spare_part_images')
            .delete()
            .in('id', deletedImageIds);

        if (deleteError) console.error('Error deleting part images:', deleteError);
    }

    // 3. Reset existing to not primary (we will set new primary later)
    await supabase.from('spare_part_images').update({ is_primary: false }).eq('spare_part_id', partId);

    // 4. Upload New Images
    if (newImages.length > 0) {
        const imagePromises = newImages.map(async (file, index) => {
            try {
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const fileName = `${timestamp}-${randomSuffix}.webp`;

                const mainPath = `${partId}/${fileName}`;
                const mainUrl = await uploadSparePartImage(file, mainPath);

                if (mainUrl) {
                    return {
                        spare_part_id: partId,
                        url: mainUrl,
                        is_primary: false // Set false initially
                    };
                }
                return null;
            } catch (e) {
                console.error("Error processing part image", e);
                return null;
            }
        });

        const uploadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);

        if (uploadedImages.length > 0) {
            await supabase.from('spare_part_images').insert(uploadedImages);
        }
    }

    return true;
};

// Helper to set primary image for parts
export const setPrimarySparePartImage = async (partId: string, imageId: string | null) => {
    // Reset all
    await supabase.from('spare_part_images').update({ is_primary: false }).eq('spare_part_id', partId);
    if (imageId) {
        await supabase.from('spare_part_images').update({ is_primary: true }).eq('id', imageId);
    } else {
        // Find latest and set
        const { data } = await supabase.from('spare_part_images').select('id').eq('spare_part_id', partId).order('created_at', { ascending: false }).limit(1).single();
        if (data) {
            await supabase.from('spare_part_images').update({ is_primary: true }).eq('id', data.id);
        }
    }
};

// Helper for UI to call specific Main Image update
export const setMainImage = async (carId: number, imageId: string | null) => {
    // Reset all
    await supabase.from('car_images').update({ is_main: false }).eq('car_id', carId);
    if (imageId) {
        await supabase.from('car_images').update({ is_main: true }).eq('id', imageId);
    } else {
        // If imageId is null, it implies a NEW image is main.
        // We find the most recently created image for this car and make it main.
        const { data } = await supabase.from('car_images').select('id').eq('car_id', carId).order('created_at', { ascending: false }).limit(1).single();
        if (data) {
            await supabase.from('car_images').update({ is_main: true }).eq('id', data.id);
        }
    }
};

export const searchUsers = async (query: string): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(10);

    if (error) return [];
    return data as Profile[];
};

export const trackPageView = async (
    path: string,
    userId?: string,
    countryCode: string = 'QA',
    countryName?: string
) => {
    try {
        let pageType = 'other';
        let entityId: string | null = null;

        // Determine Page Type and Entity ID
        // Check for Home Page: / or /code or /code/
        const isCountryHome = /^\/[a-zA-Z]{2}\/?$/.test(path);

        if (path === '/' || path === '' || isCountryHome) {
            pageType = 'home';
        } else if (path.includes('/cars')) {
            const parts = path.split('/');
            // Check if last part or second to last is a number (id)
            // Example: /qa/cars/123 or /qa/cars
            const possibleId = parts[parts.length - 1];
            if (!isNaN(Number(possibleId)) && possibleId !== '') {
                pageType = 'car_detail';
                entityId = possibleId;
            } else {
                pageType = 'cars_list';
            }
        } else if (path.includes('/parts')) pageType = 'parts_list';
        else if (path.includes('/dealers') || path.includes('/showrooms')) {
            if (path.includes('/showrooms/')) {
                const parts = path.split('/');
                const possibleId = parts[parts.length - 1];
                if (!isNaN(Number(possibleId))) {
                    pageType = 'showroom_detail';
                    entityId = possibleId;
                }
            } else {
                pageType = 'dealers_list';
            }
        }
        else if (path.includes('/services')) pageType = 'services_list';
        else if (path.includes('/rental')) pageType = 'rental_list';
        else if (path.includes('/login')) pageType = 'login';
        else if (path.includes('/signup')) pageType = 'signup';
        else if (path.includes('/sell')) pageType = 'sell';

        let sessionId = localStorage.getItem('mawater_session_id');
        if (!sessionId) {
            sessionId = generateUUID();
            localStorage.setItem('mawater_session_id', sessionId);
        }

        // Fetch IP and Location Data (with caching)
        let ipAddress = sessionStorage.getItem('mw_client_ip');
        let city = sessionStorage.getItem('mw_client_city');
        let realCountry = sessionStorage.getItem('mw_client_real_country');

        if (!ipAddress || !realCountry) {
            try {
                // Primary: ipapi.co
                const response = await fetch('https://ipapi.co/json/');
                if (response.ok) {
                    const data = await response.json();
                    ipAddress = data.ip;
                    city = data.city;
                    realCountry = data.country_name;
                } else {
                    throw new Error('Primary IP service failed');
                }
            } catch (e) {
                // Fallback: ipwho.is
                try {
                    const fb = await fetch('https://ipwho.is/');
                    if (fb.ok) {
                        const data = await fb.json();
                        if (data.success) {
                            ipAddress = data.ip;
                            city = data.city;
                            realCountry = data.country; // "country" field is the name here
                        }
                    }
                } catch (err) {
                    console.warn('IP detection failed');
                }
            }

            if (ipAddress) sessionStorage.setItem('mw_client_ip', ipAddress);
            if (city) sessionStorage.setItem('mw_client_city', city);
            if (realCountry) sessionStorage.setItem('mw_client_real_country', realCountry);
        }

        // Insert into user_page_views1
        await supabase.from('user_page_views1').insert({
            session_id: sessionId,
            user_id: userId || null,
            page_path: path,
            page_type: pageType,
            entity_id: entityId,
            country_code: countryCode, // From App Context (URL/Selection)
            real_country_name: realCountry || null, // From IP Detection
            referrer: window.location.href, // Save the full current URL as requested
            user_agent: navigator.userAgent,
            is_authenticated: !!userId,
            ip_address: ipAddress || null,
            city: city || null
        });
    } catch (e) {
        console.error("Failed to track page view", e);
    }
};

export const getAdminStats = async () => {
    const { count: carsCount } = await supabase.from('cars').select('*', { count: 'exact', head: true });
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: dealersCount } = await supabase.from('dealerships').select('*', { count: 'exact', head: true });
    const { count: partsCount } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true });

    return {
        carsCount: carsCount || 0,
        usersCount: usersCount || 0,
        dealersCount: dealersCount || 0,
        partsCount: partsCount || 0
    };
};

export const updateCarStatus = async (carId: number, status: 'approved' | 'rejected' | 'pending' | 'sold' | 'archived') => {
    const { error } = await supabase.from('cars').update({ status }).eq('id', carId);
    return !error;
};

export const updateCarFeatured = async (carId: number, is_featured: boolean) => {
    const { error } = await supabase.from('cars').update({ is_featured }).eq('id', carId);
    return !error;
};

export const deleteCar = async (carId: number) => {
    const { error } = await supabase.from('cars').update({ status: 'archived' }).eq('id', carId);
    return !error;
};

export const deleteSparePart = async (partId: string) => {
    const { error } = await supabase.from('spare_parts').update({ status: 'archived' }).eq('id', partId);
    return !error;
};

export const getAllUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data as Profile[];
};

export const sendContactMessage = async (messageData: Partial<ContactMessage>): Promise<boolean> => {
    const { error } = await supabase.from('contact_messages').insert([messageData]);
    if (error) {
        console.error("Error sending contact message:", error);
        return false;
    }
    return true;
};

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const separator = ',';
    const keys = Object.keys(data[0]);
    const csvContent =
        keys.join(separator) +
        '\n' +
        data.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportAllDataJSON = async () => {
    const { data: cars } = await supabase.from('cars').select('*');
    const { data: users } = await supabase.from('profiles').select('*');
    const { data: dealerships } = await supabase.from('dealerships').select('*');
    const { data: spare_parts } = await supabase.from('spare_parts').select('*');

    const bundle = {
        timestamp: new Date().toISOString(),
        cars,
        users,
        dealerships,
        spare_parts
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mawater_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const importDataJSON = async (jsonString: string) => {
    try {
        const bundle = JSON.parse(jsonString);
        if (bundle.users) {
            const { error } = await supabase.from('profiles').upsert(bundle.users);
            if (error) console.error("Error importing users", error);
        }
        if (bundle.dealerships) {
            const { error } = await supabase.from('dealerships').upsert(bundle.dealerships);
            if (error) console.error("Error importing dealerships", error);
        }
        if (bundle.cars) {
            const { error } = await supabase.from('cars').upsert(bundle.cars);
            if (error) console.error("Error importing cars", error);
        }
        if (bundle.spare_parts) {
            const { error } = await supabase.from('spare_parts').upsert(bundle.spare_parts);
            if (error) console.error("Error importing parts", error);
        }
        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
};
