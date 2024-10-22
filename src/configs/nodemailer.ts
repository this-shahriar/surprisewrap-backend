import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    //auth needs domain registration
  },
});

export const sendMail = async ({ email }: { email: string }) => {
  const info = await transporter.sendMail({
    from: '"Surprisewrap"',
    to: email,
    //mail options
  });

  console.log("Message sent: %s", info.messageId);
};
