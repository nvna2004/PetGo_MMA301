const nodemailer = require("nodemailer");
const dns = require("dns");

// Ép Node.js sử dụng IPv4 trước IPv6 để sửa lỗi ENETUNREACH trên hạ tầng Render
dns.setDefaultResultOrder("ipv4first");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Bắt buộc false cho cổng 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
    // Thêm cái này để vượt qua các lớp chặn bảo mật của Render
    tls: {
      rejectUnauthorized: false 
    }
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    // Nếu email lỗi, ta chỉ log ra chứ không làm sập App
    console.error("Email error: ", error);
    return null; 
  }
};

module.exports = sendEmail;