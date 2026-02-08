import ENV from "../configs/env";
import { getTransporter } from "../configs/nodeMailer";

import {
  resetCodeTemplate,
  resetSuccessTemplate,
  emailLinkedSuccessTemplate,
  welcomePasswordTemplate,
} from "./emailTemplate";

export const sendWelcomePasswordEmail = async (
  name: string,
  email: string,
  password: string,
) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `Chatify <${ENV.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Welcome to Chatify – Your Account Password",
    html: welcomePasswordTemplate(name, password),
  });

  if (!info.messageId) {
    console.error("Error sending welcome password email", info);
    throw new Error("Failed to send welcome password email");
  }

  console.log("Welcome password email sent", info.messageId);
};

export const sendEmailLinkedSuccessEmail = async (
  name: string,
  email: string,
  deviceId: string,
) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `Chatify <${ENV.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Chatify – Email Linked Successfully",
    html: emailLinkedSuccessTemplate(name, deviceId),
  });

  if (!info.messageId) {
    console.error("Error sending email linked success email", info);
    throw new Error("Failed to send email linked success email");
  }

  console.log("Email linked success email sent", info.messageId);
};

export const forgotPasswordEmail = async (
  name: string,
  email: string,
  resetCode: string,
) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `Chatify <${ENV.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Chatify – Password Reset Code",
    html: resetCodeTemplate(name, resetCode),
  });

  if (!info.messageId) {
    console.error("Error sending forgot password email", info);
    throw new Error("Failed to send forgot password email");
  }

  console.log("Reset code sent successfully", info.messageId);
};

export const sendPasswordResetSuccessEmail = async (email: string) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `Chatify <${ENV.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: "Chatify – Password Reset Successful",
    html: resetSuccessTemplate(),
  });

  if (!info.messageId) {
    console.error("Error sending password reset success email", info);
    throw new Error("Failed to send password reset success email");
  }

  console.log("Password reset success email sent", info.messageId);
};
