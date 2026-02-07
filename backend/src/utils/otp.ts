import axios from "axios";
import ENV from "../configs/env";

interface SendOtpParams {
  smsMessage: string;
  phoneNumber: string | string[];
}

// Function to login and get token
const loginAndGetToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      ENV.SMS_LOGIN,
      {
        Name: ENV.SMS_USER,
        Password: ENV.SMS_PASS,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const token = response.data?.data?.token;
    if (!token) throw new Error("Token not found in login response");

    return token;
  } catch (error: any) {
    console.error(
      "❌ Login to tabaarak failed:",
      error.response?.data || error.message,
    );
    return null;
  }
};

const sendOtp = async ({
  smsMessage,
  phoneNumber,
}: SendOtpParams): Promise<{ status: boolean; data: any }> => {
  try {
    // 1️⃣ Login to get token
    const token = await loginAndGetToken();
    if (!token) {
      return { status: false, data: "Login failed, cannot send OTP" };
    }

    console.log("✅ Token received:", {
      token,
      smsMessage,
      phoneNumber,
    });

    // 2️⃣ Send OTP using the token
    const response = await axios.post(
      ENV.SMS_SEND_OTP,
      {
        smsMessage,
        mobile: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber], // ✅ wrap single phone in array
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ OTP sent successfully:", response.data);

    return { status: true, data: response.data };
  } catch (error: any) {
    console.error(
      "❌ Error sending OTP:",
      error.response?.data || error.message,
    );
    return { status: false, data: error.response?.data || null };
  }
};

export default sendOtp;
