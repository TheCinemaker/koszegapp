import { useState, useEffect } from 'react';

/**
 * useGyroTilt Hook
 * Returns tilt values { x, y } based on device orientation.
 * Range: -1 to 1 (clamped for subtle effect)
 */
export function useGyroTilt(maxTilt = 25) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hasPermission, setHasPermission] = useState(false);
    const [permissionRequested, setPermissionRequested] = useState(false);

    const handleOrientation = (event) => {
        const { beta, gamma } = event; // beta: front-back (-180 to 180), gamma: left-right (-90 to 90)

        if (beta === null || gamma === null) return;

        // Normalize and clamp values
        // We want subtle movement, so we clamp beta/gamma
        // x: gamma (left-right tilt)
        // y: beta (front-back tilt) - subtract 45deg as "neutral" holding position

        // Amplified sensitivity for "Liquid" feel
        // We allow up to maxTilt degrees, but map it to -1...1 range
        // Multiplier 1.5 makes it reach 1.0 faster (more reactive)
        const x = Math.max(-1, Math.min(1, (gamma / maxTilt) * 1.5));
        const y = Math.max(-1, Math.min(1, ((beta - 45) / maxTilt) * 1.5));

        // Debug logging (remove after testing)
        console.log('Gyro values:', { beta, gamma, x, y });

        setTilt({ x, y });
    };

    const requestPermission = async () => {
        if (permissionRequested) return;
        setPermissionRequested(true);

        console.log('Requesting gyro permission...');

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                console.log('Permission state:', permissionState);
                if (permissionState === 'granted') {
                    setHasPermission(true);
                    window.addEventListener('deviceorientation', handleOrientation);
                    console.log('Gyro listener attached!');
                }
            } catch (e) {
                console.error("Gyro permission failed", e);
            }
        } else {
            // Non-iOS or older devices usually don't need explicit permission prompt
            setHasPermission(true);
            window.addEventListener('deviceorientation', handleOrientation);
            console.log('Gyro listener attached (non-iOS)!');
        }
    };

    useEffect(() => {
        // Check if DeviceOrientationEvent is supported
        if (!window.DeviceOrientationEvent) {
            console.log('DeviceOrientationEvent not supported');
            return;
        }

        // Auto-request for non-iOS devices
        if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
            requestPermission();
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [maxTilt]);

    return { tilt, hasPermission, requestPermission };
}
