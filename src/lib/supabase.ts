import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          preferred_location: string;
          latitude: number | null;
          longitude: number | null;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          preferred_location?: string;
          latitude?: number | null;
          longitude?: number | null;
          country?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          preferred_location?: string;
          latitude?: number | null;
          longitude?: number | null;
          country?: string;
          updated_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          brand_name: string;
          title: string;
          description: string;
          discount_percentage: number | null;
          discount_amount: number | null;
          code: string | null;
          category: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          country: string;
          valid_from: string;
          valid_until: string | null;
          terms_conditions: string;
          external_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          featured_image: string;
          meta_title: string;
          meta_description: string;
          meta_keywords: string;
          og_image: string;
          status: string;
          author_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      admin_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: string;
          description: string;
          updated_by: string | null;
          updated_at: string;
        };
      };
      user_saved_coupons: {
        Row: {
          id: string;
          user_id: string;
          coupon_id: string;
          created_at: string;
        };
      };
      user_locations: {
        Row: {
          id: string;
          user_id: string | null;
          latitude: number;
          longitude: number;
          city: string;
          country: string;
          ip_address: string;
          created_at: string;
        };
      };
    };
  };
};
