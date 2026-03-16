const Booking = require('../models/Booking');
const User = require('../models/User');
const PetService = require('../models/PetService');


const getShopDashboardStats = async (req, res) => {
  try {

    const user = req.user;
    
    if (user.role !== 'shop_owner') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin cửa hàng.' });
    }

    const shopId = user._id;


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);


    const bookingsToday = await Booking.countDocuments({
      shopOwner: shopId,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });


    const activePetsCount = await Booking.distinct('pet', {
      shopOwner: shopId,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'completed'] }
    });


    const pendingOrdersCount = await Booking.countDocuments({
      shopOwner: shopId,
      status: 'pending'
    });


    const revenueResult = await Booking.aggregate([
      {
        $match: {
          shopOwner: shopId,
          status: 'completed',
          updatedAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        shopInfo: {
          name: user.name,
          address: user.address?.street || '',
        },
        stats: {
          bookingsToday,
          activePets: activePetsCount.length,
          pendingOrders: pendingOrdersCount,
          monthlyRevenue
        }
      }
    });

  } catch (error) {
    console.error('getShopDashboardStats Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getPendingBookings = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'shop_owner') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin cửa hàng.' });
    }

    const pendingBookings = await Booking.find({
      shopOwner: user._id,
      status: 'pending'
    })
    .populate('user', 'name')
    .populate({
      path: 'pet',
      select: 'name breed type weight image'
    })
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .limit(10); 

    res.status(200).json({
      success: true,
      data: pendingBookings
    });
  } catch (error) {
    console.error('getPendingBookings Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getAllShops = async (req, res) => {
  try {
    const { search, category } = req.query;

    let shopIds = null;


    if (category) {
      const servicesInCategory = await PetService.find({ category }).select('shopOwner').lean();
      shopIds = [...new Set(servicesInCategory.map(s => s.shopOwner.toString()))];
    }


    const query = { role: 'shop_owner' };

    if (shopIds !== null) {
      query._id = { $in: shopIds };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { 'address.street': { $regex: search.trim(), $options: 'i' } },
        { 'address.city': { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const shops = await User.find(query, { name: 1, address: 1, coordinates: 1, createdAt: 1 }).lean();

    res.status(200).json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('getAllShops Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getShopById = async (req, res) => {
  try {
    const shop = await User.findOne(
      { _id: req.params.id, role: 'shop_owner' },
      { name: 1, address: 1, coordinates: 1, createdAt: 1 }
    ).lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy shop.' });
    }

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    console.error('getShopById Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getShopServices = async (req, res) => {
  try {
    const services = await PetService.find({ shopOwner: req.params.id })
      .populate('category', 'name')
      .lean();

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('getShopServices Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  getShopDashboardStats,
  getPendingBookings,
  getAllShops,
  getShopById,
  getShopServices
};
