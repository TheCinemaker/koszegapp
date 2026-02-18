export function inferMovement(speed) {
    if (speed < 3) return "walking";
    if (speed < 15) return "bike";
    if (speed < 80) return "car";
    return "fast";
}
