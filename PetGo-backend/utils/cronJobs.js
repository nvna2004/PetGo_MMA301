const Booking = require('../models/Booking');

const startCronJobs = () => {
  // Chạy mỗi phút để check đơn hết hạn (đã tạo quá 15 phút)
  setInterval(async () => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const result = await Booking.updateMany(
        {
          status: 'pending',
          paymentMethod: 'vnpay',
          paymentStatus: 'pending',
          createdAt: { $lt: fifteenMinutesAgo }
        },
        {
          $set: {
            status: 'cancelled',
            paymentStatus: 'failed',
            notes: 'Hệ thống tự động hủy do quá hạn thanh toán VNPay (15 phút)'
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[CronJob] Đã tự động hủy ${result.modifiedCount} đơn VNPay hết hạn thanh toán.`);
      }

      // Xử lý hủy các đơn hàng (Chờ duyệt hoặc Đã duyệt) mà quá hạn ngày hẹn > 1 ngày (24 giờ)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const overdueResult = await Booking.updateMany(
        {
          status: { $in: ['pending', 'confirmed'] },
          bookingDate: { $lt: oneDayAgo }
        },
        {
          $set: {
            status: 'cancelled',
            notes: 'Hệ thống tự động hủy do đơn hàng đã quá hạn thời gian làm dịch vụ.'
          }
        }
      );

      if (overdueResult.modifiedCount > 0) {
        console.log(`[CronJob] Đã tự động hủy ${overdueResult.modifiedCount} đơn hàng do quá hạn lịch hẹn.`);
      }
    } catch (error) {
      console.error('[CronJob] Lỗi khi kiểm tra hủy đơn:', error);
    }
  }, 60 * 1000); // Check 1 phút 1 lần
};

module.exports = { startCronJobs };
