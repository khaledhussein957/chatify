import ENV from "../configs/env";
import { getTransporter } from "../configs/nodeMailer";

import { resetCodeTemplate, resetSuccessTemplate } from "./emailTemplate";

export const forgotPasswordEmail = async (
  name: string,
  email: string,
  resetCode: string
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
    from: `Chatify <${ENV.SMTP_EMAIL}>`,
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
