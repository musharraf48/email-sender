import nodemailer from 'nodemailer';

// Attachment type definition
type Attachment = {
  filename?: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
};

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Verify transporter configuration
export const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection error:', error);
    return false;
  }
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: Attachment[]
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Musharraf" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

