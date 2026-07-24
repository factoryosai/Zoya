/**
 * Triggers short, subtle haptic pulses on supported devices via the Vibration API.
 */
export function triggerHaptic(type: "command" | "speaking_finished" | "button_tap" | "success" = "command") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "command":
        // Double subtle tap when receiving a user command
        navigator.vibrate([15, 35, 15]);
        break;
      case "speaking_finished":
        // Single short pulse when Heer finishes speaking
        navigator.vibrate(25);
        break;
      case "button_tap":
        // Quick 10ms click feedback
        navigator.vibrate(10);
        break;
      case "success":
        // Double success pulse
        navigator.vibrate([20, 40, 20]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (e) {
    // Suppress errors on unsupported or non-user-gesture platforms
  }
}
