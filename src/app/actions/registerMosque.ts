'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the SERVICE ROLE KEY
// This allows the server action to bypass RLS and insert data without a user session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function submitMosqueRegistration(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const area = formData.get('area') as string;
        const address = formData.get('address') as string;
        const latitude = formData.get('latitude') as string;
        const longitude = formData.get('longitude') as string;

        // Facilities Checkboxes
        const has_wudu_area = formData.get('wudu') === 'on';
        const has_womens_area = formData.get('womens') === 'on';
        const has_wheelchair_access = formData.get('wheelchair') === 'on';
        const has_ac = formData.get('ac') === 'on';
        const has_parking = formData.get('parking') === 'on';
        const has_library = formData.get('library') === 'on';

        if (!name || !area || !address) {
            return { error: 'Name, area, and address are required fields.' };
        }

        // 1. Insert Mosque (Defaults to is_approved: false)
        const { data: mosque, error: mosqueError } = await supabaseServer
            .from('mosques')
            .insert({
                name,
                area,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                is_approved: false
            })
            .select()
            .single();

        if (mosqueError) throw new Error(`Mosque Error: ${mosqueError.message}`);
        const mosqueId = mosque.id;

        // 2. Insert blank Prayers row linked to this mosque
        const { error: prayersError } = await supabaseServer
            .from('prayers')
            .insert({ mosque_id: mosqueId });

        if (prayersError) throw new Error(`Prayers Error: ${prayersError.message}`);

        // 3. Insert Facilities row
        const { error: facilitiesError } = await supabaseServer
            .from('facilities')
            .insert({
                mosque_id: mosqueId,
                has_wudu_area,
                has_womens_area,
                has_wheelchair_access,
                has_ac,
                has_parking,
                has_library
            });

        if (facilitiesError) throw new Error(`Facilities Error: ${facilitiesError.message}`);

        return { success: true };

    } catch (err: any) {
        console.error("Registration Server Action Error:", err);
        return { error: err.message || 'An unexpected error occurred during registration.' };
    }
}
