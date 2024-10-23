import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendMail = async ({ email }: { email: string }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: "Hello from surprisewrap",
    text: "This is a test email sent using Mailjet with Nodemailer.",
  });

  return info;
};
