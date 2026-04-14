import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://pxjnagfudscsqgzxwfti.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4am5hZ2Z1ZHNjc3Fnenh3ZnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDQ0NTUsImV4cCI6MjA4NjI4MDQ1NX0.WLx4_BQglkYBu_2_G7j5SRqLi7yezDzoB_DFM9sqsy0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
