const User = require("../models/User");
const Pet = require("../models/Pet");
const ShopRequest = require("../models/ShopRequest");


const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const petCount = await Pet.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    
    res.status(200).json({
      success: true,
      stats: {
        users: userCount,
        pets: petCount,
        activeUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("+active");
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const activateUser = async (req, res) => {
  try {

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: "You cannot deactivate your own account" 
      });
    }

    const user = await User.findById(req.params.id).select("+active");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.active = !user.active;
    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find({}).populate("owner", "name email");
    res.status(200).json({
      success: true,
      pets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllShopRequests = async (req, res) => {
  try {
    const requests = await ShopRequest.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const processShopRequest = async (req, res) => {
  try {
    const { status, adminMessage } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await ShopRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = status;
    request.adminMessage = adminMessage || '';
    await request.save();


    if (status === 'approved') {
      const user = await User.findById(request.user);
      if (user) {
        user.role = 'shop_owner';
        user.coordinates = request.coordinates;
        // Cập nhật trường GeoJSON location
        user.location = {
          type: 'Point',
          coordinates: [request.coordinates.longitude, request.coordinates.latitude]
        };
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  activateUser,
  getAllPets,
  getAllShopRequests,
  processShopRequest
};
