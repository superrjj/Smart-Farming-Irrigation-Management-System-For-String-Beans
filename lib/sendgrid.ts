import { SENDGRID_CONFIG } from './sendgridConfig';

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  if (!SENDGRID_CONFIG.apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const resetLink = `https://yourapp.com/reset-password?token=${resetToken}`;
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Password Reset Request',
      }],
      from: { email: SENDGRID_CONFIG.fromEmail },
      content: [{
        type: 'text/plain',
        value: `Click the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send password reset email');
  }

  return { success: true };
}
