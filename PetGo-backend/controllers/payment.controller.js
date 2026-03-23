const crypto = require('crypto');
const qs = require('qs');
const Booking = require('../models/Booking');

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });
  return sorted;
}

function getVNTime() {
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${vnNow.getUTCFullYear()}${pad(vnNow.getUTCMonth() + 1)}${pad(vnNow.getUTCDate())}${pad(vnNow.getUTCHours())}${pad(vnNow.getUTCMinutes())}${pad(vnNow.getUTCSeconds())}`;
}

const orderBookingMap = {};

const createVNPayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const tmnCode   = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl    = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = getVNTime();
    const orderId    = createDate + bookingId.slice(-8);
    const amount     = String(Math.round(booking.price * 100));

    orderBookingMap[orderId] = bookingId;

    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';
    if (ipAddr.startsWith('::ffff:')) ipAddr = ipAddr.replace('::ffff:', '');

    let vnpParams = {};
    vnpParams['vnp_Version']    = '2.1.0';
    vnpParams['vnp_Command']    = 'pay';
    vnpParams['vnp_TmnCode']    = tmnCode;
    vnpParams['vnp_Locale']     = 'vn';
    vnpParams['vnp_CurrCode']   = 'VND';
    vnpParams['vnp_TxnRef']     = orderId;
    vnpParams['vnp_OrderInfo']  = 'Thanh toan don hang PetGo';
    vnpParams['vnp_OrderType']  = 'other';
    vnpParams['vnp_Amount']     = amount;
    vnpParams['vnp_ReturnUrl']  = returnUrl;
    vnpParams['vnp_IpAddr']     = ipAddr;
    vnpParams['vnp_CreateDate'] = createDate;

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac     = crypto.createHmac('sha512', secretKey);
    const signed   = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;

    const paymentUrl = vnpUrl + '?' + qs.stringify(vnpParams, { encode: false });

    res.json({ success: true, paymentUrl, bookingId });
  } catch (error) {
    console.error('VNPay Create Payment Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo thanh toán VNPay' });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    let vnpParams = { ...req.query };
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = sortObject(vnpParams);

    const secretKey = process.env.VNP_HASH_SECRET;
    const signData  = qs.stringify(vnpParams, { encode: false });
    const hmac      = crypto.createHmac('sha512', secretKey);
    const signed    = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const responseCode  = vnpParams['vnp_ResponseCode'];
    const transactionId = decodeURIComponent(vnpParams['vnp_TransactionNo'] || '');
    const txnRef        = decodeURIComponent(vnpParams['vnp_TxnRef'] || '');

    const bookingId = orderBookingMap[txnRef];

    const success = (secureHash === signed && responseCode === '00');

    if (success && bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus:      'completed',
        paymentMethod:      'vnpay',
        vnpayTransactionId: transactionId,
      });
      delete orderBookingMap[txnRef];
    } else if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
      delete orderBookingMap[txnRef];
    }

    res.send(`
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; max-width: 90%; width: 320px; }
          .icon { font-size: 72px; margin-bottom: 20px; }
          .title { color: ${success ? '#10b981' : '#ef4444'}; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
          .message { color: #6b7280; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
          .app-btn { background: #3b82f6; color: white; border: none; padding: 14px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; width: 100%; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
          .app-btn:active { transform: translateY(2px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${success ? '✅' : '❌'}</div>
          <div class="title">${success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}</div>
          <div class="message">${success ? 'Giao dịch đã hoàn tất. Đơn đặt lịch của bạn đã được ghi nhận hệ thống.' : 'Quá trình thanh toán không thành công. Hãy thử lại.'}</div>
          <button class="app-btn" onclick="window.close();">Vui lòng nhấn nút X ở góc trên để quay lại ứng dụng PetGo</button>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('VNPay Return Error:', error);
    res.send('<html><body><h2>Có lỗi xảy ra</h2><p>Vui lòng nhấn nút X phía trên để quay lại ứng dụng.</p></body></html>');
  }
};

module.exports = { createVNPayPayment, vnpayReturn };
