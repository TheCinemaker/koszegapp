/**
 * actionExecutor.js – KőszegAI v2.1
 * Executes deterministic actions resolved by router.js.
 * All DB writes go through user JWT (RLS enforced).
 */
import { saveVehicle, buildParkingAction } from './tools/parkingTool.js';

export async function executeAction(action, userId, token) {
    if (!action) return null;

    switch (action.type) {

        // User consented to save + start parking
        case 'save_and_start_parking': {
            if (userId && token) {
                await saveVehicle(action.params.licensePlate, userId, token);
            }
            return buildParkingAction(action.params);
        }

        // User declined save but wants parking
        case 'start_parking_only': {
            return buildParkingAction(action.params);
        }

        // Emergency (always available)
        case 'call_emergency': {
            return { type: 'call_emergency', params: action.params };
        }

        default:
            console.warn('Unknown action type:', action.type);
            return null;
    }
}
