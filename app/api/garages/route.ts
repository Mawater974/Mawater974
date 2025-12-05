// app/api/garages/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Garage, GarageFilters, GarageResponse } from '@/types/garage';

export const dynamic = 'force-dynamic'; // Add this line to make it explicitly dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const supabase = createClient();
    
    // Parse query parameters
    const filters: GarageFilters = {
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      sort_by: (searchParams.get('sort_by') as 'name' | 'rating' | 'created_at') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      is_featured: searchParams.get('is_featured') === 'true' ? true : undefined,
      is_verified: searchParams.get('is_verified') === 'true' ? true : undefined,
    };

    // Build the query
    let query = supabase
      .from('garages')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
    }

    if (filters.city) {
      query = query.or(`city_en.eq.${filters.city},city_ar.eq.${filters.city}`);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }

    // Apply sorting
    if (filters.sort_by) {
      query = query.order(filters.sort_by, { 
        ascending: filters.sort_order === 'asc' 
      });
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute the query
    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    const response: GarageResponse = {
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching garages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garages' },
      { status: 500 }
    );
  }
}
