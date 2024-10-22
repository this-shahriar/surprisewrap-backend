import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    // user: 'your-mailjet-api-key', // Your Mailjet API key
    // pass: 'your-mailjet-secret-key' // Your Mailjet secret key
  },
});

export const sendMail = async ({ email }: { email: string }) => {
  const info = await transporter.sendMail({
    from: '"Surprisewrap"',
    to: email,
    //mail options
    subject: "Hello from Mailjet", // Subject line
    text: "This is a test email sent using Mailjet with Nodemailer.", // Plain text body
  });

  console.log("Message sent: %s", info.messageId);
};
