const PetService = require('../models/PetService');
const ServiceCategory = require('../models/ServiceCategory');


const getCategories = async (req, res) => {
  try {
    let categories = await ServiceCategory.find();
    

    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Tắm sấy', description: 'Dịch vụ tắm và sấy khô cho thú cưng' },
        { name: 'Cắt tỉa & Grooming', description: 'Cắt tỉa lông và làm đẹp' },
        { name: 'Lưu trú', description: 'Dịch vụ trông gửi chó mèo' },
        { name: 'Huấn luyện', description: 'Dạy các lệnh cơ bản và nâng cao' },
        { name: 'Thú y', description: 'Khám chữa bệnh và tiêm phòng' }
      ];
      await ServiceCategory.insertMany(defaultCategories);
      categories = await ServiceCategory.find();
    }

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('getCategories Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getMyServices = async (req, res) => {
  try {
    const services = await PetService.find({ shopOwner: req.user._id }).populate('category', 'name');
    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('getMyServices Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const createService = async (req, res) => {
  try {
    const { name, description, category, price, duration, image } = req.body;

    if (!name || !category || !price || !duration) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin dịch vụ.' });
    }

    const service = await PetService.create({
      name,
      description,
      category,
      shopOwner: req.user._id,
      price: parseFloat(price),
      duration: parseInt(duration),
      image: image || 'no-photo.jpg'
    });

    res.status(201).json({
      success: true,
      message: 'Đã tạo dịch vụ thành công.',
      data: service
    });
  } catch (error) {
    console.error('createService Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const updateService = async (req, res) => {
  try {
    let service = await PetService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    }

    if (service.shopOwner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Bạn không có quyền chỉnh sửa dịch vụ này.' });
    }

    service = await PetService.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật dịch vụ thành công.',
      data: service
    });
  } catch (error) {
    console.error('updateService Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const deleteService = async (req, res) => {
  try {
    const service = await PetService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ.' });
    }

    if (service.shopOwner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Bạn không có quyền xóa dịch vụ này.' });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa dịch vụ thành công.'
    });
  } catch (error) {
    console.error('deleteService Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};


const getAllServices = async (req, res) => {
  try {
    const { q, category } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (q && q.trim()) {
      filter.name = { $regex: q.trim(), $options: 'i' };
    }

    const services = await PetService.find(filter)
      .populate('category', 'name')
      .populate('shopOwner', 'name address coordinates')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('getAllServices Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  getCategories,
  getMyServices,
  getAllServices,
  createService,
  updateService,
  deleteService
};
