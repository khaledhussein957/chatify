const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch] as string,
  );

export const emailLinkedSuccessTemplate = (name: string, deviceId: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    
    <div style="
      background:#1A1A1D;
      padding:36px;
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    ">

      <h2 style="
        color:#22C55E;
        margin:0 0 6px 0;
        font-size:20px;
        font-weight:700;
      ">
        Chatify
      </h2>

      <p style="
        color:#9CA3AF;
        font-size:13px;
        margin:0 0 20px 0;
      ">
        Account updated successfully
      </p>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        margin:0 0 16px 0;
      ">
        Hi ${escapeHtml(name)},
      </p>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        line-height:1.7;
        margin:0 0 24px 0;
      ">
        Your email address has been successfully linked to your
        <strong>Chatify</strong> account.
      </p>

      <div style="
        background:#0F172A;
        padding:18px;
        border-radius:10px;
        border:1px solid #22C55E33;
        margin:0 0 24px 0;
      ">
        <p style="margin:0 0 8px 0;color:#9CA3AF;font-size:12px;">
          Account details
        </p>

        <p style="margin:0;color:#D1D5DB;font-size:14px;">
          <strong>Name:</strong> ${escapeHtml(name)}
        </p>

        <p style="margin:6px 0 0 0;color:#D1D5DB;font-size:14px;">
          <strong>Device ID:</strong> ${escapeHtml(deviceId)}
        </p>
      </div>

      <p style="
        color:#9CA3AF;
        font-size:12px;
        line-height:1.6;
        margin:0;
      ">
        If you did not make this change, please contact Chatify support immediately.
      </p>

    </div>
  </div>
</body>
</html>
`;

export const resetCodeTemplate = (name: string, code: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    
    <div style="
      background:#1A1A1D;
      padding:36px;
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    ">

      <h2 style="
        color:#22C55E;
        margin:0 0 6px 0;
        font-size:20px;
        font-weight:700;
      ">
        Chatify
      </h2>

      <p style="
        color:#9CA3AF;
        font-size:13px;
        margin:0 0 20px 0;
      ">
        Password Reset Code
      </p>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        margin:0 0 16px 0;
      ">
        Hi ${escapeHtml(name)},
      </p>

      <div style="
        margin:24px 0;
        padding:18px;
        background:#0F172A;
        color:#22C55E;
        font-size:28px;
        letter-spacing:6px;
        text-align:center;
        border-radius:10px;
        font-weight:700;
        border:1px solid #22C55E33;
      ">
        ${escapeHtml(code)}
      </div>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        line-height:1.7;
        margin:0 0 18px 0;
      ">
        Enter this code in the Chatify app to reset your password.
      </p>

      <p style="
        color:#9CA3AF;
        font-size:12px;
        line-height:1.6;
        margin:0;
      ">
        This code expires in 5 minutes. If you didn’t request this, you can safely ignore this email.
      </p>

    </div>
  </div>
</body>
</html>
`;

export const resetSuccessTemplate = () => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    
    <div style="
      background:#1A1A1D;
      padding:36px;
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    ">
      
      <h2 style="
        color:#22C55E;
        margin:0 0 16px 0;
        font-size:20px;
        font-weight:700;
      ">
        Chatify
      </h2>

      <h3 style="
        color:#F4F4F5;
        margin:0 0 12px 0;
        font-size:18px;
        font-weight:600;
      ">
        Password reset successful ✅
      </h3>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        line-height:1.7;
        margin:0 0 20px 0;
      ">
        Your Chatify password has been updated successfully.
        You can now log in using your new password.
      </p>

      <p style="
        color:#9CA3AF;
        font-size:12px;
        line-height:1.6;
        margin:0;
      ">
        If you didn’t make this change, please contact Chatify support immediately.
      </p>

    </div>
  </div>
</body>
</html>
`;

export const welcomePasswordTemplate = (name: string, password: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    
    <div style="
      background:#1A1A1D;
      padding:36px;
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    ">
      
      <h2 style="
        color:#22C55E;
        margin:0 0 6px 0;
        font-size:20px;
        font-weight:700;
      ">
        Chatify
      </h2>

      <p style="
        color:#9CA3AF;
        font-size:13px;
        margin:0 0 20px 0;
      ">
        Welcome to Chatify!
      </p>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        margin:0 0 16px 0;
      ">
        Hi ${escapeHtml(name)},
      </p>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        line-height:1.7;
        margin:0 0 24px 0;
      ">
        Your account profile is now complete. We have generated a secure password for you to log in to your account.
      </p>

      <div style="
        background:#0F172A;
        padding:18px;
        border-radius:10px;
        border:1px solid #22C55E33;
        margin:0 0 24px 0;
        text-align:center;
      ">
        <p style="margin:0 0 8px 0;color:#9CA3AF;font-size:12px;">
          Your login password
        </p>

        <p style="
          margin:0;
          color:#22C55E;
          font-size:24px;
          font-weight:700;
          letter-spacing:2px;
        ">
          ${escapeHtml(password)}
        </p>
      </div>

      <p style="
        color:#D1D5DB;
        font-size:14px;
        line-height:1.7;
        margin:0 0 24px 0;
      ">
        Please save this password securely. You can change it anytime in your profile settings.
      </p>

      <p style="
        color:#9CA3AF;
        font-size:12px;
        line-height:1.6;
        margin:0;
      ">
        Welcome aboard! If you have any questions, feel free to contact our support team.
      </p>

    </div>
  </div>
</body>
</html>
`;
