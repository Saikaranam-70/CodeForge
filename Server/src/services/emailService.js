const nodemailer = require("nodemailer");

/**
 * Helper to build high-end dark cyberpunk HTML email template
 */
const generateEmailTemplate = ({ title, username, otp, mainText, subText, badgeColor = "#6366f1" }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 0;
    }
    .main-table {
      max-width: 580px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      padding: 32px 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: #6366f1;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-container {
      background: #1e293b;
      border: 1px dashed ${badgeColor};
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #cbd5e1;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 0 20px ${badgeColor}80;
    }
    .otp-expire {
      font-size: 13px;
      color: #f59e0b;
      margin-top: 10px;
      font-weight: 500;
    }
    .security-box {
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #fca5a5;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .footer {
      background: #0d131f;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <h1 class="brand-title">⚡ CodeForge</h1>
          <div class="brand-subtitle">Collaborative Algorithmic Coding Platform</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">${username ? `Hello ${username},` : "Hello Developer,"}</div>
          <div class="message">${mainText}</div>
          
          <div class="otp-container">
            <div class="otp-label">Your One-Time Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expire">⏱️ Valid for 10 minutes</div>
          </div>

          <div class="security-box">
            ${subText || "If you did not request this verification code, please ignore this email or reach out to our security support team immediately."}
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px 0;">This is an automated system email from CodeForge. Please do not reply directly.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} CodeForge. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

/**
 * Creates Nodemailer Transporter with Brevo SMTP Relay
 */
const createTransporter = () => {
  const smtpKey = process.env.SMTP_KEY || process.env.BREVO_API_KEY;
  const smtpUser = process.env.BREVO_LOGIN || process.env.SMTP_USER || process.env.BERO_EMAIL || "saimanikantakaranam682@gmail.com";

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // TLS
    auth: {
      user: smtpUser,
      pass: smtpKey
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Unified email sender with Brevo API, SMTP, and Development Fallback
 */
const sendEmail = async ({ to, subject, htmlContent, textContent, otp = "" }) => {
  const senderEmail = process.env.BERO_EMAIL || "saimanikantakaranam682@gmail.com";
  const smtpKey = process.env.SMTP_KEY || process.env.BREVO_API_KEY;
  const isTestEnv = process.env.NODE_ENV === "test";

  // If in test environment, log and return immediately
  if (isTestEnv) {
    console.log(`[EmailService Test Mode] Email to: ${to} | Subject: ${subject} | OTP: ${otp}`);
    return { success: true, method: "test-mock", data: { to, otp } };
  }

  // 1. Try Brevo REST API (if key is valid REST API key)
  if (smtpKey && smtpKey.startsWith("xkeysib-")) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": smtpKey
        },
        body: JSON.stringify({
          sender: { name: "CodeForge", email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[EmailService] Dispatched via Brevo API to ${to}`);
        return { success: true, method: "brevo-api", data: result };
      }
    } catch (err) {
      console.warn(`[EmailService] Brevo API attempt: ${err.message}`);
    }
  }

  // 2. Try Nodemailer SMTP
  if (smtpKey) {
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"CodeForge" <${senderEmail}>`,
        to,
        subject,
        text: textContent || "Your CodeForge verification code.",
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Dispatched via Nodemailer SMTP to ${to} (MessageId: ${info.messageId})`);
      return { success: true, method: "nodemailer-smtp", data: info };
    } catch (smtpError) {
      console.warn(`[EmailService] SMTP delivery attempt failed: ${smtpError.message}`);
      console.log(`\n======================================================`);
      console.log(`[EMAIL FALLBACK] To: ${to}`);
      console.log(`[EMAIL FALLBACK] Subject: ${subject}`);
      console.log(`[EMAIL FALLBACK] Verification Code (OTP): ${otp}`);
      console.log(`======================================================\n`);
      return { success: true, method: "console-fallback", otp };
    }
  }

  // 3. Fallback: Log OTP to console
  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH] To: ${to}`);
  console.log(`[EMAIL DISPATCH] Subject: ${subject}`);
  console.log(`[EMAIL DISPATCH] Verification Code (OTP): ${otp}`);
  console.log(`======================================================\n`);

  return { success: true, method: "console-log", otp };
};

/**
 * Send Registration Verification OTP
 */
const sendRegistrationOtpEmail = async (email, otp, username) => {
  const htmlContent = generateEmailTemplate({
    title: "Verify Your CodeForge Account",
    username: username || "Developer",
    otp,
    mainText: "Welcome to <strong>CodeForge</strong>! To verify your email address and activate your account, please enter the one-time verification code below into the registration screen.",
    subText: "Never share this code with anyone. CodeForge support will never ask for your verification code.",
    badgeColor: "#6366f1"
  });

  const subject = `${otp} is your CodeForge Verification Code`;
  return await sendEmail({
    to: email,
    subject,
    htmlContent,
    textContent: `Your CodeForge verification code is: ${otp}. It expires in 10 minutes.`,
    otp
  });
};

/**
 * Send Password Reset OTP
 */
const sendForgotPasswordOtpEmail = async (email, otp, username) => {
  const htmlContent = generateEmailTemplate({
    title: "Reset Your CodeForge Password",
    username: username || "Developer",
    otp,
    mainText: "We received a request to reset your password for your <strong>CodeForge</strong> account. Use the code below to complete your password reset.",
    subText: "If you did NOT request a password reset, please secure your account or ignore this email. Your password will remain unchanged.",
    badgeColor: "#ef4444"
  });

  const subject = `${otp} is your CodeForge Password Reset Code`;
  return await sendEmail({
    to: email,
    subject,
    htmlContent,
    textContent: `Your CodeForge password reset code is: ${otp}. It expires in 10 minutes.`,
    otp
  });
};

module.exports = {
  sendEmail,
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail
};
