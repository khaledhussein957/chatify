import dotenv from "dotenv";

dotenv.config({ quiet: true });

const ENV = {
  MONGO_URI: process.env.MONGO_URI || "",
  PORT: process.env.PORT || "9000",

  JWT_SECRET: process.env.JWT_SECRET || "",

  SMTP_EMAIL: process.env.SMTP_EMAIL || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "",

  SMS_SEND_OTP: process.env.SMS_SEND_OTP || "",
  SMS_LOGIN: process.env.SMS_LOGIN || "",
  SMS_USER: process.env.SMS_USER || "",
  SMS_PASS: process.env.SMS_PASS || "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  API_URL: process.env.API_URL || "",

  STREAM_API_KEY: process.env.STREAM_API_KEY || "",
  STREAM_SECRET_KEY: process.env.STREAM_SECRET_KEY || "",
};

export default ENV;
