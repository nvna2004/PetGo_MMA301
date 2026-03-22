const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },

    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
    },

    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    phone: {
      type: String,
      required: [true, "Please enter your phone number"],
      unique: true,
    },

    role: {
      type: String,
      enum: ["customer", "shop_owner", "admin"],
      default: "customer",
    },

    avatar: {
      type: String,
      default: "no-avatar.jpg",
    },

    address: {
      street: String,
      city: String,
      ward: String,
      country: String,
    },

    active: {
      type: Boolean,
      default: false,
      select: false, 
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    otpSentAt: {
      type: Date,
      select: false,
    },

    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
  },
  { timestamps: true },
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
