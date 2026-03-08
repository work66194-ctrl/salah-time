'use server';

import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function submitTimeSuggestion(mosqueId: string, prayerName: string, suggestedTime: string) {
    if (!mosqueId || !prayerName || !suggestedTime) {
        return { error: 'Missing required fields' };
    }

    const supabase = getServiceClient();

    // Convert 12-hour AM/PM string to 24-hour format if needed before saving
    // Example format expected by database: "05:00" or "14:30"
    // However, if the frontend supplies HH:mm directly from an input type="time", it's already 24-hour!

    // Enforce 24-hour standard HH:mm via basic validation:
    const timeMatch = suggestedTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
    if (!timeMatch) {
        return { error: 'Invalid time format. Must be HH:mm.' };
    }

    const { error } = await supabase
        .from('time_suggestions')
        .insert({
            mosque_id: mosqueId,
            prayer_name: prayerName,
            suggested_time: suggestedTime,
            status: 'pending'
        });

    if (error) {
        console.error("Suggestion Error:", error);
        return { error: error.message };
    }

    return { success: true };
}
