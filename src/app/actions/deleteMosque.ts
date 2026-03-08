'use server';

import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function deleteMosque(mosqueId: string) {
    const supabase = getServiceClient();
    const { error } = await supabase
        .from('mosques')
        .delete()
        .eq('id', mosqueId);
    if (error) return { error: error.message };
    return { success: true };
}
