import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_HOST,
  // port: 587,
  // secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendMail = async ({ email, subject, text }: any) => {
  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_SENDER}" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: subject,
    text: text,
  });

  return info;
};
