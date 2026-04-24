import 'dotenv/config';
import nodemailer from 'nodemailer';
import { APP_NAME } from '../utils/constants.js';
import { logger, toLogError } from './logger.js';

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS,
  );
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    logger.warn('Email configuration not provided, skipping SMTP verification');
    return false;
  }

  try {
    await transporter.verify();
    logger.info('Email service configured successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration error', {
      error: toLogError(error),
    });
    return false;
  }
}

// Send email wrapper
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> {
  const { to, subject, text, html } = options;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

// Email Templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Bhaga-Banti!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Bhaga-Banti - the easiest way to share expenses with friends and family.</p>
        <p>With Bhaga-Banti, you can:</p>
        <ul>
          <li>Create groups and add expenses</li>
          <li>Split bills equally or unequally</li>
          <li>See who owes whom</li>
          <li>Simplify debts to minimize transactions</li>
        </ul>
        <p>Get started by creating your first group!</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),

  addedToGroup: (groupName: string, addedBy: string) => ({
    subject: `You've been added to ${groupName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Group!</h1>
        <p>${addedBy} has added you to the group "${groupName}".</p>
        <p>You can now add expenses and see your balances in this group.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),

  newExpense: (groupName: string, payerName: string, amount: string, description: string) => ({
    subject: `New expense in ${groupName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Expense Added</h1>
        <p>${payerName} paid <strong>₹${amount}</strong> for "${description}" in ${groupName}.</p>
        <p>Your balance has been updated accordingly.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),

  expenseUpdated: (groupName: string, updaterName: string, description: string) => ({
    subject: `Expense updated in ${groupName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Expense Updated</h1>
        <p>${updaterName} updated the expense "${description}" in ${groupName}.</p>
        <p>Please check the updated details.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),

  settlementRecorded: (fromName: string, toName: string, amount: string) => ({
    subject: 'Payment Received! 💰',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Payment Received</h1>
        <p>You received <strong>₹${amount}</strong> from ${fromName}.</p>
        <p>Your balance has been updated.</p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),

  groupInvite: (groupName: string, invitedBy: string, inviteLink: string) => ({
    subject: `Invitation to join ${groupName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">You're Invited!</h1>
        <p>${invitedBy} has invited you to join the group "${groupName}" on Bhaga-Banti.</p>
        <p>Click the button below to accept the invitation:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This invitation link will expire in 7 days.
        </p>
        <p style="margin-top: 30px; color: #666;">
          Best regards,<br>
          The Bhaga-Banti Team
        </p>
      </div>
    `,
  }),
};

export { transporter };
