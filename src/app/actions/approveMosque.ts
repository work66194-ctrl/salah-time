'use server';

import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function getPendingMosques() {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from('mosques')
        .select('id, name, area, address, latitude, longitude, created_at, facilities (*)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
    if (error) return { error: error.message, data: [] };
    return { data: data || [] };
}

export async function approveMosque(mosqueId: string) {
    const supabase = getServiceClient();
    const { error } = await supabase
        .from('mosques')
        .update({ is_approved: true })
        .eq('id', mosqueId);
    if (error) return { error: error.message };
    return { success: true };
}

export async function rejectMosque(mosqueId: string) {
    const supabase = getServiceClient();
    const { error } = await supabase
        .from('mosques')
        .delete()
        .eq('id', mosqueId);
    if (error) return { error: error.message };
    return { success: true };
}
