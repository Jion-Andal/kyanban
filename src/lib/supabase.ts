import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient, isClientConfigured } from '../utils/supabase/client';

export const isSupabaseConfigured = isClientConfigured();

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient() : null;
