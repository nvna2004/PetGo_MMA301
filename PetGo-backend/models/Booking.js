const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetService',
    required: true
  },

  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },

  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  bookingDate: {
    type: Date,
    required: true
  },

  timeSlot: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },

  price: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'card'],
    default: 'cash'
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },

  notes: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);