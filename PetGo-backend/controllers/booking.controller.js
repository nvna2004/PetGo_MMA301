const Booking = require('../models/Booking');
const PetService = require('../models/PetService');


const createBooking = async (req, res) => {
  try {
    const { service, pet, shopOwner, bookingDate, timeSlot, paymentMethod, notes } = req.body;


    const petService = await PetService.findById(service);
    if (!petService) {
      return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại' });
    }


    const now = new Date();
    const bDate = new Date(bookingDate);
    

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(bDate);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < today) {
      return res.status(400).json({ success: false, message: 'Không thể đặt lịch cho ngày đã qua' });
    }

    if (compareDate.getTime() === today.getTime()) {


      const startHour = parseInt(timeSlot.split(':')[0]);
      if (now.getHours() >= startHour) {
        return res.status(400).json({ success: false, message: 'Khung giờ này đã trôi qua, vui lòng chọn khung giờ khác' });
      }
    }

    const booking = await Booking.create({
      user: req.user._id,
      service,
      pet,
      shopOwner,
      bookingDate,
      timeSlot,
      price: petService.price,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
      notes
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const autoCancelOverdueBookings = async () => {
  try {
    const pendingBookings = await Booking.find({ status: 'pending' });
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingsToCancel = pendingBookings.filter(b => {
      const bDate = new Date(b.bookingDate);
      const compareDate = new Date(bDate);
      compareDate.setHours(0, 0, 0, 0);

      if (compareDate < today) return true;
      if (compareDate.getTime() === today.getTime()) {
        const startHour = parseInt(b.timeSlot.split(':')[0]);
        if (now.getHours() >= startHour) return true;
      }
      return false;
    }).map(b => b._id);

    if (bookingsToCancel.length > 0) {
      await Booking.updateMany(
        { _id: { $in: bookingsToCancel } },
        { $set: { status: 'cancelled' } }
      );
    }
  } catch (error) {
    console.error("Auto cancel error:", error);
  }
};

const getMyBookings = async (req, res) => {
  try {
    await autoCancelOverdueBookings();
    
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'name price duration image')
      .populate('pet', 'name type breed image')
      .populate('shopOwner', 'name address phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get My Bookings Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getShopBookings = async (req, res) => {
  try {
    await autoCancelOverdueBookings();

    const bookings = await Booking.find({ shopOwner: req.user._id })
      .populate('service', 'name price duration')
      .populate('pet', 'name type breed medicalNotes')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get Shop Bookings Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch đặt' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Lịch đặt đã được hủy trước đó' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Không thể hủy lịch đã hoàn thành' });
    }


    const now = new Date();
    const bookingDate = new Date(booking.bookingDate);
    const diffTime = bookingDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays <= 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chỉ có thể hủy lịch đặt trước ít nhất 24 giờ' 
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, shopOwner: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch đặt' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getShopBookings,
  cancelBooking,
  updateBookingStatus
};
