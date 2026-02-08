import * as Application from "expo-application";

/**
 * Retrieves a unique identifier for the current device.
 * Tries Android ID first, then iOS Vendor ID, then falls back to a timestamp-based ID.
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    const id =
      (await Application.getAndroidId()) ||
      (await Application.getIosIdForVendorAsync()) ||
      `device-${Date.now()}`;
    return id;
  } catch (error) {
    console.error("Error getting device ID:", error);
    return `device-${Date.now()}`;
  }
};
