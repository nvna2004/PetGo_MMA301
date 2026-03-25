const { Resend } = require('resend');

// Khởi tạo Resend với API Key lấy từ .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const { data, error } = await resend.emails.send({
      // Trong môi trường test của Resend, bạn BẮT BUỘC dùng email gửi từ 'onboarding@resend.dev'
      from: 'PetGo System <onboarding@resend.dev>',
      
      // LƯU Ý QUAN TRỌNG: Ở gói Free của Resend (khi chưa add domain thật của bạn),
      // bạn CHỈ CÓ THỂ gửi email TỚI địa chỉ email mà bạn đã dùng để đăng ký tài khoản Resend.
      to: [options.email], 
      
      subject: options.subject,
      text: options.message,
      html: options.html, 
    });

    if (error) {
      console.error("Resend API chặn gửi hoặc báo lỗi:", error);
      throw error;
    }

    console.log("Gửi email thành công qua Resend:", data);
    return data;
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    throw error;
  }
};

module.exports = sendEmail;