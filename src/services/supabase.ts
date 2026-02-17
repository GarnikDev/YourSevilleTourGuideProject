import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hywvlwfvrqghdqhgdtse.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iMRzTu0EEe6ZjAf5lYxcsA_-EZYCyxG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);