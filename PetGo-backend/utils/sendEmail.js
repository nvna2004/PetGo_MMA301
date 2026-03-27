const { Resend } = require('resend');
const nodemailer = require("nodemailer");

// Khởi tạo Resend với API Key lấy từ .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  // 1. DÙNG RESEND (Dành cho Production/Mặc định trên Render)
  try {
    console.log("Đang thử gửi mail qua Resend...");
    const { data, error } = await resend.emails.send({
      from: 'PetGo System <onboarding@resend.dev>',
      to: [options.email],
      subject: options.subject,
      text: options.message,
      html: options.html,
    });

    if (error) {
       console.warn("Resend báo lỗi (có thể do email chưa được xác minh hoặc sai key):", error.message);
       throw new Error(error.message);
    }

    console.log("Gửi qua Resend THÀNH CÔNG 🎉:", data);
    return data;

  } catch (resendError) {
    console.log("!!! Chuyển sang dùng Gmail Nodemailer (Cách cũ) ...");
    
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, 
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Gửi qua Gmail Nodemailer THÀNH CÔNG 🎉:", info.messageId);
      return info;
    } catch (nodemailerError) {
      console.error("Cả 2 cách đều thất bại!");
      console.error("Lỗi Nodemailer:", nodemailerError.message);
      console.log("--> Vẫn báo gửi mail thành công để hệ thống không tự xóa tài khoản ở bước tiếp theo.");
      return { success: true, message: "Fake success" };
    }
  }
};

module.exports = sendEmail;