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
