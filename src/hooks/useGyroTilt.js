import { useState, useEffect } from 'react';

/**
 * useGyroTilt Hook
 * Returns tilt values { x, y } based on device orientation.
 * Range: -1 to 1 (clamped for subtle effect)
 */
export function useGyroTilt(maxTilt = 15) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // Check if DeviceOrientationEvent is supported
        if (!window.DeviceOrientationEvent) return;

        const handleOrientation = (event) => {
            const { beta, gamma } = event; // beta: front-back (-180 to 180), gamma: left-right (-90 to 90)

            if (beta === null || gamma === null) return;

            // Normalize and clamp values
            // We want subtle movement, so we clamp beta/gamma
            // x: gamma (left-right tilt)
            // y: beta (front-back tilt) - subtract 45deg as "neutral" holding position

            const x = Math.max(-maxTilt, Math.min(maxTilt, gamma)) / maxTilt;
            const y = Math.max(-maxTilt, Math.min(maxTilt, beta - 45)) / maxTilt;

            setTilt({ x, y });
        };

        // iOS 13+ requires permission
        const requestAccess = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permissionState = await DeviceOrientationEvent.requestPermission();
                    if (permissionState === 'granted') {
                        setHasPermission(true);
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (e) {
                    console.error("Gyro permission failed", e);
                }
            } else {
                // Non-iOS or older devices usually don't need explicit permission prompt
                setHasPermission(true);
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        // Auto-start listener for non-iOS or try if already granted
        requestAccess();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [maxTilt]);

    return { tilt, hasPermission };
}
