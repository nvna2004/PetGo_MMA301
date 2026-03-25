require('dotenv').config();
const { Resend } = require('resend');

// Khởi tạo Resend với API Key lấy từ .env
const apiKey = process.env.RESEND_API_KEY;
console.log("Checking API Key: ", apiKey ? "Found key: " + apiKey.substring(0, 7) + "..." : "MISSING!");

const resend = new Resend(apiKey);

async function test() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PetGo System <onboarding@resend.dev>',
      to: ['nvna2705@gmail.com'], // Ghi cứng email của user để test
      subject: 'Test Resend API',
      html: '<p>Congrats on sending your <strong>first email</strong> via Resend!</p>'
    });

    if (error) {
      console.error("LỖI RESEND:", error);
      return;
    }

    console.log("THÀNH CÔNG! Email ID:", data.id);
  } catch (err) {
    console.error("LỖI EXCEPTION:", err);
  }
}

test();
