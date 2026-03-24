const nodemailer = require("nodemailer");
const dns = require("dns");

// Ép sử dụng IPv4 để tránh lỗi ENETUNREACH trên Render
dns.setDefaultResultOrder("ipv4first");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Mã 16 ký tự bạn vừa có
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    // SỬA Ở ĐÂY: Dùng EMAIL_USER để tránh bị Gmail coi là mạo danh
    from: `"${process.env.FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, 
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;