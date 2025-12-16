import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration for this project
const supabaseUrl = 'https://xzouepokakzubwjogmdr.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3VlcG9rYWt6dWJ3am9nbWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODY3MTUsImV4cCI6MjA4MDg2MjcxNX0.kqvEprlsrAmFt6qYTNDPvhWpAsLJJU_oKf-kIhlf2bc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);