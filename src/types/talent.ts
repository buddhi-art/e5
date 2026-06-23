export type TalentType = 'model' | 'actor' | 'voice_artist' | 'dancer' | 'makeup_artist' | 'stylist' | 'photographer' | 'freelance_editor' | 'freelance_videographer' | 'sound_engineer' | 'colorist' | 'motion_designer' | 'other';

export type TalentGender = 'male' | 'female' | 'other';

export type BookingStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled';

export interface Talent {
    id: string;
    full_name: string;
    stage_name: string | null;
    talent_type: TalentType;
    phone_number: string | null;
    email: string | null;
    gender: TalentGender | null;
    date_of_birth: string | null;
    location: string | null;
    height_cm: number | null;
    languages: string[] | null;
    skills: string[] | null;
    rate_type: string;
    rate_amount: number | null;
    currency: string;
    portfolio_urls: Record<string, string>;
    photo_url: string | null;
    notes: string | null;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TalentBooking {
    id: string;
    talent_id: string;
    project_id: string | null;
    booking_date: string;
    end_date: string | null;
    rate_type: string;
    rate_amount: number;
    total_compensation: number;
    status: BookingStatus;
    description: string | null;
    location: string | null;
    notes: string | null;
    booked_by: string | null;
    created_at: string;
}

export interface TalentProjectHistory {
    id: string;
    talent_id: string;
    project_id: string;
    role: string;
    feedback: string | null;
    rating: number | null;
    created_at: string;
}
