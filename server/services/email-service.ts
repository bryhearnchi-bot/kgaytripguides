/**
 * Email Service using Resend
 *
 * Provides professional email delivery for user invitations and notifications.
 * Features:
 * - HTML email templates with responsive design
 * - Error handling and retry logic
 * - Environment-based configuration
 * - Professional branding for KGay Travel Guides
 */

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration - fail fast if not configured
function getEmailConfig() {
  const fromEmail = process.env.FROM_EMAIL;
  const replyTo = process.env.REPLY_TO_EMAIL;
  const baseUrl = process.env.FRONTEND_BASE_URL;

  if (!fromEmail) {
    throw new Error('FATAL: FROM_EMAIL environment variable is required');
  }
  if (!replyTo) {
    throw new Error('FATAL: REPLY_TO_EMAIL environment variable is required');
  }
  if (!baseUrl) {
    throw new Error('FATAL: FRONTEND_BASE_URL environment variable is required');
  }

  return {
    fromEmail,
    fromName: 'KGay Travel Guides',
    replyTo,
    baseUrl,
  };
}

const EMAIL_CONFIG = getEmailConfig();

/**
 * Send invitation email with professional HTML template
 */
export async function sendInvitationEmail(
  recipientEmail: string,
  invitationToken: string,
  inviterName: string,
  role: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Generate invitation URL
    const invitationUrl = `${EMAIL_CONFIG.baseUrl}/auth/accept-invitation?token=${invitationToken}`;

    // Create HTML email template
    const htmlContent = createInvitationEmailTemplate({
      recipientEmail,
      inviterName,
      role,
      invitationUrl,
      expiresIn: '72 hours',
    });

    // Create plain text version
    const textContent = createInvitationEmailText({
      recipientEmail,
      inviterName,
      role,
      invitationUrl,
      expiresIn: '72 hours',
    });

    // Send email via Resend
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to: recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `You're invited to join KGay Travel Guides`,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'invitation' },
        { name: 'role', value: role },
      ],
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: unknown) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create HTML email template for invitations
 */
function createInvitationEmailTemplate({
  recipientEmail,
  inviterName,
  role,
  invitationUrl,
  expiresIn,
}: {
  recipientEmail: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  expiresIn: string;
}): string {
  const roleDisplayNames: Record<string, string> = {
    admin: 'Administrator',
    content_editor: 'Content Editor',
    media_manager: 'Media Manager',
    viewer: 'Viewer',
  };

  const roleDisplay = roleDisplayNames[role] || role;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to KGay Travel Guides</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .email-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 2px;
    }
    .email-content {
      background: white;
      border-radius: 10px;
      padding: 40px 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    .tagline {
      color: #666;
      font-size: 14px;
    }
    .main-content {
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .invitation-details {
      background: #f8fafc;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .role-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      width: 200px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .expiry-notice {
      background: #fef3cd;
      color: #d97706;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      .email-content {
        padding: 20px 15px;
      }
      .cta-button {
        width: 100%;
        padding: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-content">
      <div class="header">
        <div class="logo">🏳️‍🌈 KGay Travel Guides</div>
        <div class="tagline">Your Gateway to Extraordinary LGBTQ+ Travel Experiences</div>
      </div>

      <div class="main-content">
        <div class="greeting">
          Hello there! 👋
        </div>

        <p>
          <strong>${inviterName}</strong> has invited you to join <strong>KGay Travel Guides</strong>
          as a <span class="role-badge">${roleDisplay}</span>
        </p>

        <div class="invitation-details">
          <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
          <p style="margin-bottom: 0;">
            Click the button below to accept your invitation and create your account.
            You'll get access to our amazing platform where you can discover incredible
            LGBTQ+ travel experiences and connect with our vibrant community.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${invitationUrl}" class="cta-button">
            Accept Invitation
          </a>
        </div>

        <div class="expiry-notice">
          ⏰ <strong>Important:</strong> This invitation expires in ${expiresIn}.
          Don't wait too long to join the adventure!
        </div>

        <p>
          If you have any questions, feel free to reply to this email or contact our support team.
          We're excited to welcome you to the KGay Travel Guides family!
        </p>
      </div>

      <div class="footer">
        <p>
          Best regards,<br>
          The KGay Travel Guides Team
        </p>
        <p style="font-size: 12px; color: #999;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Create plain text version of invitation email
 */
function createInvitationEmailText({
  recipientEmail,
  inviterName,
  role,
  invitationUrl,
  expiresIn,
}: {
  recipientEmail: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  expiresIn: string;
}): string {
  const roleDisplayNames: Record<string, string> = {
    admin: 'Administrator',
    content_editor: 'Content Editor',
    media_manager: 'Media Manager',
    viewer: 'Viewer',
  };

  const roleDisplay = roleDisplayNames[role] || role;

  return `
🏳️‍🌈 KGay Travel Guides - Invitation

Hello there!

${inviterName} has invited you to join KGay Travel Guides as a ${roleDisplay}.

What's Next?
Click the link below to accept your invitation and create your account:

${invitationUrl}

You'll get access to our amazing platform where you can discover incredible LGBTQ+ travel experiences and connect with our vibrant community.

⏰ Important: This invitation expires in ${expiresIn}. Don't wait too long to join the adventure!

If you have any questions, feel free to reply to this email or contact our support team. We're excited to welcome you to the KGay Travel Guides family!

Best regards,
The KGay Travel Guides Team

---
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string,
  userName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}`;

    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to: recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Reset your KGay Travel Guides password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>You requested to reset your password for KGay Travel Guides.</p>
          <p><a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Hi ${userName}, you requested to reset your password. Click this link: ${resetUrl} (expires in 1 hour)`,
      tags: [{ name: 'type', value: 'password-reset' }],
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: unknown) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
