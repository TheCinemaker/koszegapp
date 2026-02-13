/**
 * Haptic Feedback Utility
 * 
 * Provides a centralized way to trigger haptic feedback patterns.
 * Gracefully handles environments where navigator.vibrate is not available.
 */

export const HapticType = {
    LIGHT: 'light',   // Subtle tap (navigation, selection)
    MEDIUM: 'medium', // Standard button press
    HEAVY: 'heavy',   // Important action (delete, confirm)
    SUCCESS: 'success', // Double tap
    ERROR: 'error',   // Error vibration
    WARNING: 'warning', // Warning vibration
};

export const triggerHaptic = (type = HapticType.LIGHT) => {
    // Check if vibration is supported
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
        return;
    }

    try {
        switch (type) {
            case HapticType.LIGHT:
                navigator.vibrate(5); // Ultra short tap
                break;
            case HapticType.MEDIUM:
                navigator.vibrate(15); // Noticeable tap
                break;
            case HapticType.HEAVY:
                navigator.vibrate(40); // Heavy thud
                break;
            case HapticType.SUCCESS:
                navigator.vibrate([10, 50, 20]); // Da-dun!
                break;
            case HapticType.ERROR:
                navigator.vibrate([50, 30, 50, 30, 50]); // Brrr-brrr-brrr
                break;
            case HapticType.WARNING:
                navigator.vibrate([30, 20, 30]); // Brrr-brrr
                break;
            default:
                navigator.vibrate(10);
        }
    } catch (e) {
        // Ignore errors in environments that block vibration (e.g. some iframes)
        console.debug('Haptic feedback blocked or failed', e);
    }
};
