import { Database as GeneratedDatabase } from '@/types/supabase';

declare global {
  // Extend the existing Database type
  export type Database = GeneratedDatabase & {
    public: {
      Tables: {
        user_page_views: {
          Row: {
            id: string;
            user_id: string | null;
            session_id: string | null;
            country_code: string;
            page_type: string;
            entity_id: string | null;
            page_path: string;
            created_at: string;
            user_agent: string | null;
            is_authenticated: boolean;
            real_country_name: string | null;
          };
          Insert: {
            id?: string;
            user_id?: string | null;
            session_id?: string | null;
            country_code: string;
            page_type: string;
            entity_id?: string | null;
            page_path: string;
            created_at?: string;
            user_agent?: string | null;
            is_authenticated?: boolean;
            real_country_name?: string | null;
          };
          Update: {
            id?: string;
            user_id?: string | null;
            session_id?: string | null;
            country_code?: string;
            page_type?: string;
            entity_id?: string | null;
            page_path?: string;
            created_at?: string;
            user_agent?: string | null;
            is_authenticated?: boolean;
            real_country_name?: string | null;
          };
        };
      };
    };
  };
}

// Export the extended Database type
export type { Database };

// Helper type to get table row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
