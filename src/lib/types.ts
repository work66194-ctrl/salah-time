export interface Mosque {
    id: string;
    name: string;
    area: string;
    address: string;
    latitude?: number;
    longitude?: number;
    is_approved: boolean;
}

export interface Facilities {
    mosque_id: string;
    has_womens_area: boolean;
    has_wudu_area: boolean;
    has_ac: boolean;
    has_wheelchair_access: boolean;
    has_parking: boolean;
    has_library: boolean;
}

export interface Prayers {
    mosque_id: string;
    fajr_adhan: string;
    fajr_iqamah: string;
    dhuhr_adhan: string;
    dhuhr_iqamah: string;
    asr_adhan: string;
    asr_iqamah: string;
    maghrib_adhan: string;
    maghrib_iqamah: string;
    isha_adhan: string;
    isha_iqamah: string;
    jumuah_khutbah?: string;
    jumuah_iqamah?: string;
    ramadan_taraweeh?: string;
    ramadan_announcements?: string;
}

export interface PrayerTime {
    name: string;
    adhan: string;
    iqamah: string;
}
