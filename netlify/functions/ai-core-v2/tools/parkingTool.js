/**
 * tools/parkingTool.js – KőszegAI v2.1
 * RLS-safe DB writes using user JWT token.
 * NO service role bypass.
 */
import { createClient } from '@supabase/supabase-js';

function client(token) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        }
    );
}

/**
 * Save vehicle to user_vehicles table (with user consent).
 * RLS ensures users can only write their own records.
 */
export async function saveVehicle(plate, userId, token) {
    const supabase = client(token);

    const { error } = await supabase
        .from('user_vehicles')
        .insert({
            user_id: userId,
            license_plate: plate.toUpperCase(),
            is_default: true,
            carrier: '70'
        });

    if (error) {
        // Duplicate plate is acceptable (already saved)
        if (!error.message.includes('duplicate')) {
            console.error('saveVehicle error:', error.message);
        }
    }
}

/**
 * Returns the parking action payload for the frontend.
 * The actual SMS is sent client-side (SMSParkingCard).
 */
export function buildParkingAction(params) {
    return {
        type: 'buy_parking_ticket',
        params: {
            licensePlate: params.licensePlate?.toUpperCase(),
            duration: params.duration || null,
            zone: params.zone || null,
            useGPS: true
        }
    };
}
