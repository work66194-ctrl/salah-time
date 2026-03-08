'use server';

import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function getPendingSuggestions() {
    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('time_suggestions')
        .select(`
            id,
            mosque_id,
            prayer_name,
            suggested_time,
            status,
            created_at,
            mosques ( name, area )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) return { error: error.message, data: [] };

    return { data: data || [] };
}

export async function approveSuggestion(suggestionId: string, mosqueId: string, prayerField: string, newTime: string) {
    const supabase = getServiceClient();

    // 1. Update the actual prayers table
    const { error: updateError } = await supabase
        .from('prayers')
        .update({ [prayerField]: newTime })
        .eq('mosque_id', mosqueId);

    if (updateError) return { error: updateError.message };

    // 2. Mark the suggestion as approved
    const { error: statusError } = await supabase
        .from('time_suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestionId);

    if (statusError) return { error: statusError.message };

    return { success: true };
}

export async function rejectSuggestion(suggestionId: string) {
    const supabase = getServiceClient();

    const { error } = await supabase
        .from('time_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

    if (error) return { error: error.message };
    return { success: true };
}
