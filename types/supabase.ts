export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: number
          name: string
          country_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          country_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          country_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      models: {
        Row: {
          id: string
          brand_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      cars: {
        Row: {
          id: string
          user_id: string
          brand_id: string
          model_id: string
          exact_model: string | null
          year: number
          mileage: number
          price: number
          description: string | null
          fuel_type: string | null
          gearbox_type: string | null
          body_type: string | null
          condition: string
          color: string | null
          cylinders: string | null
          drive_type: string | null
          doors: string | null
          warranty: string | null
          warranty_months_remaining: string | null
          city_id: number | null
          country_id: number | null
          created_at: string
          updated_at: string
          is_featured: boolean
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          brand_id: string
          model_id: string
          exact_model?: string | null
          year: number
          mileage: number
          price: number
          description?: string | null
          fuel_type?: string | null
          gearbox_type?: string | null
          body_type?: string | null
          condition: string
          color?: string | null
          cylinders?: string | null
          drive_type?: string | null
          doors?: string | null
          warranty?: string | null
          warranty_months_remaining?: string | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand_id?: string
          model_id?: string
          exact_model?: string | null
          year?: number
          mileage?: number
          price?: number
          description?: string | null
          fuel_type?: string | null
          gearbox_type?: string | null
          body_type?: string | null
          condition?: string
          color?: string | null
          cylinders?: string | null
          drive_type?: string | null
          doors?: string | null
          warranty?: string | null
          warranty_months_remaining?: string | null
          city_id?: number | null
          country_id?: number | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Brand = Database['public']['Tables']['brands']['Row'];
export type Model = Database['public']['Tables']['models']['Row'];
export type City = Database['public']['Tables']['cities']['Row'] & { name_ar?: string | null };
export type Car = Database['public']['Tables']['cars']['Row'];

export type Profile = {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  role: string | null;
  email: string | null;
  phone_number: string | null;
  country_code: string | null;
};

export type Country = {
  id: number;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  phone_code: string;
  flag_url: string | null;
};
