const User = require('../models/User');
const ShopRequest = require('../models/ShopRequest');
const jwt = require('jsonwebtoken');

const sendEmail = require('../utils/sendEmail');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, street, ward, city } = req.body;


    if (!name || !email || !password || !phone) {
       return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }


    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    }).select('+active +otpExpires');

    if (existingUser) {

      if (!existingUser.active && existingUser.otpExpires < Date.now()) {
        await User.deleteOne({ _id: existingUser._id });
        console.log(`Deleted expired inactive user: ${existingUser.email}`);
      } else {

        if (existingUser.phone === phone) {
          return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng' });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
        }
      }
    }


    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải từ 8 kí tự, bao gồm ít nhất một chữ viết hoa và một chữ viết thường' 
      });
    }


    const otp = generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 


    const user = await User.create({
      name,
      email,
      password,
      phone,
      address: {
        street,
        ward,
        city
      },
      active: false,
      otp,
      otpExpires
    });


    try {
      const message = `Mã xác nhận OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong 10 phút.`;
      
      await sendEmail({
        email: user.email,
        subject: "PetGo - Xác nhận tài khoản",
        message,
        html: `<h3>Chào mừng bạn đến với PetGo</h3><p>Mã xác nhận OTP của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn trong 10 phút.</p>`
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for the OTP to activate your account.',
        userId: user._id
      });
    } catch (err) {
      console.error('Email sending failed', err);

      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again later.' });
    }

  } catch (error) {
    console.error('Register Error:', error);
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field === 'email' ? 'Email' : 'Số điện thoại'} đã tồn tại` 
      });
    }
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};


const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }


    const user = await User.findOne({ email }).select('+active +otp +otpExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.active) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }


    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }


    user.active = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account successfully verified! You can now log in.',
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }



    const user = await User.findOne({ email }).select('+password +active');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }


    if (!user.active) {
       return res.status(401).json({
        success: false,
        message: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác thực email trước khi đăng nhập.',
        needsActivation: true 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }


    user.password = undefined;

    res.status(200).json({
      success: true,
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email }).select('+otpSentAt +active');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }


    if (!user.active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác thực email trước khi đặt lại mật khẩu.' 
      });
    }


    if (user.otpSentAt) {
      const cooldownTime = 10 * 60 * 1000; // 10 minutes
      const timePassed = Date.now() - user.otpSentAt.getTime();
      
      if (timePassed < cooldownTime) {
        const minutesRemaining = Math.ceil((cooldownTime - timePassed) / (60 * 1000));
        return res.status(400).json({ 
          success: false, 
          message: `Bạn phải chờ ${minutesRemaining} phút nữa mới có thể yêu cầu gửi lại mã` 
        });
      }
    }


    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpSentAt = new Date();
    await user.save();


    try {
      await sendEmail({
        email: user.email,
        subject: "PetGo - Phục hồi mật khẩu",
        message: `Mã OTP để đặt lại mật khẩu của bạn là: ${otp}. Mã này sẽ hết hạn trong 10 phút.`,
        html: `<h3>Yêu cầu đặt lại mật khẩu</h3><p>Mã OTP của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn trong 10 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`
      });

      res.status(200).json({
        success: true,
        message: 'Mã OTP đã được gửi về email của bạn'
      });
    } catch (err) {
      console.error('Forgot password email failed', err);
      return res.status(500).json({ success: false, message: 'Không thể gửi email lúc này' });
    }

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires +password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (user.otp !== otp || user.otp === undefined) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
    }


    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu mới phải từ 8 kí tự, có chữ hoa và chữ thường' 
      });
    }


    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpSentAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    const user = await User.findById(req.user._id).select('+password');


    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }


    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu mới phải từ 8 kí tự, bao gồm ít nhất một chữ viết hoa và một chữ viết thường' 
      });
    }


    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công',
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const logoutUser = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};


const updateProfile = async (req, res) => {
  try {
    const { name, street, ward, city, latitude, longitude } = req.body;

    const fieldsToUpdate = {
      name,
      address: {
        street,
        ward,
        city
      }
    };

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }


    if (name) user.name = name;
    if (street !== undefined) user.address.street = street;
    if (ward !== undefined) user.address.ward = ward;
    if (city !== undefined) user.address.city = city;


    if (user.role === 'shop_owner') {
      if (latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '') {
        user.coordinates = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Hồ sơ đã được cập nhật thành công',
      user,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const createShopRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }


    if (user.role === 'shop_owner' || user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Bạn đã là chủ cửa hàng hoặc quản trị viên.' });
    }


    const existingRequest = await ShopRequest.findOne({ user: userId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Bạn đã có một yêu cầu đang chờ duyệt.' });
    }

    const { shopName, address, phone, email, latitude, longitude } = req.body;

    if (!shopName || !address || !phone || !email || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin cửa hàng.' });
    }


    user.name = shopName;
    user.phone = phone;
    user.email = email;
    if (user.address) {
      user.address.street = address;
    } else {
      user.address = { street: address };
    }
    await user.save();

    const shopRequest = await ShopRequest.create({
      user: userId,
      shopName,
      address,
      phone,
      email,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đăng ký mở cửa hàng thành công. Thông tin cá nhân của bạn đã được cập nhật.',
      data: shopRequest
    });

  } catch (error) {
    console.error('Create Shop Request Error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field === 'email' ? 'Email' : 'Số điện thoại'} này đã được sử dụng bởi một tài khoản khác.` 
      });
    }
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getMyShopRequest = async (req, res) => {
  try {
    const requests = await ShopRequest.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get My Shop Request Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const updateShopInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (user.role !== 'shop_owner') {
      return res.status(403).json({ success: false, message: 'Chỉ chủ cửa hàng mới có quyền thực hiện hành động này.' });
    }

    const { name, address, phone, email, latitude, longitude } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (address) {
      if (!user.address) user.address = {};
      user.address.street = address;
    }

    if (latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '') {
      user.coordinates = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cửa hàng thành công.',
      data: user
    });

  } catch (error) {
    console.error('Update Shop Info Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updatePassword,
  logoutUser,
  updateProfile,
  createShopRequest,
  getMyShopRequest,
  updateShopInfo
};
