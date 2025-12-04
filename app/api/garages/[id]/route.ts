// app/api/garages/[id]/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Garage } from '@/types/garage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;

    // Get garage details
    const { data: garage, error } = await supabase
      .from('garages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Get garage services
    const { data: services } = await supabase
      .from('garage_services')
      .select('*')
      .eq('garage_id', id);

    // Get opening hours
    const { data: openingHours } = await supabase
      .from('garage_opening_hours')
      .select('*')
      .eq('garage_id', id);

    // Transform the data to match our Garage type
    const garageData: Garage = {
      ...garage,
      services_en: services?.map(s => s.name_en) || [],
      services_ar: services?.map(s => s.name_ar) || [],
      opening_hours: openingHours || [],
      social_links: garage.social_links || {}
    };

    return NextResponse.json(garageData);
  } catch (error) {
    console.error('Error fetching garage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garage' },
      { status: 500 }
    );
  }
}