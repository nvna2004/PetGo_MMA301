const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  }
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);