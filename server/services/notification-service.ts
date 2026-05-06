import nodemailer from "nodemailer";

/**
 * Notification Service
 * Handles real email and SMS sending for production
 */

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// SMS configuration (Twilio example)
const twilioClient = process.env.TWILIO_ACCOUNT_SID
  ? require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
}

export interface SMSPayload {
  to: string;
  message: string;
  from?: string;
}

class NotificationService {
  /**
   * Send email
   */
  async sendEmail(payload: EmailPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await emailTransporter.sendMail({
        from: payload.from || process.env.SMTP_FROM_EMAIL || "noreply@qpay.io",
        to: payload.to,
        subject: payload.subject,
        html: payload.htmlContent,
        text: payload.textContent,
        replyTo: payload.replyTo,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      console.error("Email sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(payload: SMSPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!twilioClient) {
        return {
          success: false,
          error: "SMS service not configured",
        };
      }

      const result = await twilioClient.messages.create({
        body: payload.message,
        from: payload.from || process.env.TWILIO_PHONE_NUMBER,
        to: payload.to,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transaction confirmation email
   */
  async sendTransactionConfirmation(data: {
    merchantName: string;
    merchantEmail: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: Date;
  }): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #333;">Transaction Confirmation</h2>
        <p>Hello ${data.merchantName},</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Transaction Details</h3>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
          <p><strong>Amount:</strong> ${data.currency} ${data.amount.toFixed(2)}</p>
          <p><strong>Status:</strong> <span style="color: ${data.status === "approved" ? "green" : "red"};">${data.status}</span></p>
          <p><strong>Time:</strong> ${data.timestamp.toLocaleString()}</p>
        </div>

        <p>If you have any questions, please contact our support team.</p>
        
        <footer style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px; font-size: 12px; color: #666;">
          <p>© 2024 QPay. All rights reserved.</p>
          <p><a href="https://qpay.io/support">Contact Support</a> | <a href="https://qpay.io/docs">Documentation</a></p>
        </footer>
      </div>
    `;

    const result = await this.sendEmail({
      to: data.merchantEmail,
      subject: `Transaction Confirmation - ${data.transactionId}`,
      htmlContent,
      textContent: `Transaction ${data.transactionId}: ${data.amount} ${data.currency} - ${data.status}`,
    });

    return result.success;
  }

  /**
   * Settlement summary email
   */
  async sendSettlementSummary(data: {
    merchantName: string;
    merchantEmail: string;
    settlementId: string;
    periodStart: Date;
    periodEnd: Date;
    grossVolume: number;
    fees: number;
    netAmount: number;
    transactionCount: number;
    payoutDate: Date;
  }): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #333;">Settlement Summary</h2>
        <p>Hello ${data.merchantName},</p>
        
        <p>Your settlement for the period ${data.periodStart.toLocaleDateString()} to ${data.periodEnd.toLocaleDateString()} is ready.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Settlement Details</h3>
          <table style="width: 100%;">
            <tr>
              <td><strong>Settlement ID:</strong></td>
              <td>${data.settlementId}</td>
            </tr>
            <tr>
              <td><strong>Transactions:</strong></td>
              <td>${data.transactionCount}</td>
            </tr>
            <tr>
              <td><strong>Gross Volume:</strong></td>
              <td>$${data.grossVolume.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Fees:</strong></td>
              <td>-$${data.fees.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #ddd; font-weight: bold;">
              <td><strong>Net Payout:</strong></td>
              <td style="color: green;">$${data.netAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Payout Date:</strong></td>
              <td>${data.payoutDate.toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <p>The payout will be deposited to your linked bank account.</p>
        
        <footer style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px; font-size: 12px; color: #666;">
          <p>© 2024 QPay. All rights reserved.</p>
          <p><a href="https://qpay.io/dashboard">View Dashboard</a> | <a href="https://qpay.io/support">Contact Support</a></p>
        </footer>
      </div>
    `;

    const result = await this.sendEmail({
      to: data.merchantEmail,
      subject: `Settlement Summary - ${data.settlementId}`,
      htmlContent,
    });

    return result.success;
  }

  /**
   * Alert notification email
   */
  async sendAlertEmail(data: {
    merchantName: string;
    merchantEmail: string;
    alertType: string;
    message: string;
    severity: "info" | "warning" | "critical";
    actionUrl?: string;
  }): Promise<boolean> {
    const severityColor = {
      info: "#3498db",
      warning: "#f39c12",
      critical: "#e74c3c",
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background-color: ${severityColor[data.severity]}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">⚠️ ${data.alertType}</h2>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px;">
          <p>Hello ${data.merchantName},</p>
          
          <p style="font-size: 16px; color: #333;">${data.message}</p>
          
          ${
            data.actionUrl
              ? `<a href="${data.actionUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Take Action</a>`
              : ""
          }
          
          <footer style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px; font-size: 12px; color: #666;">
            <p>Severity: <strong>${data.severity}</strong></p>
            <p>© 2024 QPay. All rights reserved.</p>
          </footer>
        </div>
      </div>
    `;

    const result = await this.sendEmail({
      to: data.merchantEmail,
      subject: `[${data.severity.toUpperCase()}] ${data.alertType}`,
      htmlContent,
    });

    return result.success;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: {
    email: string;
    verificationLink: string;
    expiresIn: number;
  }): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        
        <p>Please click the link below to verify your email address:</p>
        
        <a href="${data.verificationLink}" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          Verify Email
        </a>
        
        <p style="color: #666;">Or copy this link: <br><code style="background-color: #f5f5f5; padding: 5px;">${data.verificationLink}</code></p>
        
        <p style="color: #999; font-size: 12px;">This link expires in ${data.expiresIn} hours.</p>
      </div>
    `;

    const result = await this.sendEmail({
      to: data.email,
      subject: "Verify Your QPay Email",
      htmlContent,
    });

    return result.success;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    email: string;
    resetLink: string;
    expiresIn: number;
  }): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        
        <p>You requested a password reset. Click the link below to create a new password:</p>
        
        <a href="${data.resetLink}" style="display: inline-block; background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          Reset Password
        </a>
        
        <p style="color: #666;">Or copy this link: <br><code style="background-color: #f5f5f5; padding: 5px;">${data.resetLink}</code></p>
        
        <p style="color: #999; font-size: 12px;">This link expires in ${data.expiresIn} minutes. If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;

    const result = await this.sendEmail({
      to: data.email,
      subject: "Reset Your QPay Password",
      htmlContent,
    });

    return result.success;
  }

  /**
   * Send SMS alert
   */
  async sendSMSAlert(data: {
    phoneNumber: string;
    message: string;
    alertType: string;
  }): Promise<boolean> {
    const result = await this.sendSMS({
      to: data.phoneNumber,
      message: `[${data.alertType}] ${data.message}`,
    });

    return result.success;
  }

  /**
   * Test email connection
   */
  async testEmailConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await emailTransporter.verify();
      return {
        success: true,
        message: "Email connection verified",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export const notificationService = new NotificationService();
