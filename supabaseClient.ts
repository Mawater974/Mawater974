import { createClient } from '@supabase/supabase-js';

// Access process.env variables which are replaced by Vite's define plugin during build
const processEnv = typeof process !== 'undefined' ? process.env : {};

const SUPABASE_URL = processEnv.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ljbccbtufshhloprzity.supabase.co';
const SUPABASE_ANON_KEY = processEnv.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYmNjYnR1ZnNoaGxvcHJ6aXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5NDk3NzYsImV4cCI6MjA1NjUyNTc3Nn0.djps2FZEueEkiExQg-Yj86v2izYj6vb5Sn5oIByglTQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);