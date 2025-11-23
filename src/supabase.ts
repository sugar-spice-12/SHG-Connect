// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase credentials
const supabaseUrl = 'https://imbwxzdydqpbriwlrfda.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltYnd4emR5ZHFwYnJpd2xyZmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjQ3NjksImV4cCI6MjA3OTQwMDc2OX0.GAsemKo9lP8AK2ng-VrnCaqPz5E0A73XxYiul7oQmRM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User type
export interface SupabaseUser {
  id: string
  email: string
  phone?: string
  user_metadata?: {
    name?: string
    role?: string
  }
}