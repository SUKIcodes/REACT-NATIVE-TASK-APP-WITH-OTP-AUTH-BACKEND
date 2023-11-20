const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "Password must be at least 8 characters"],
  },
  avatar: {
    public_id: String,
    url: String,
  },
  tasks: [
    {
      title: String,
      description: String,
      completed: Boolean,
      createdAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  otp: Number,
  otp_expiry: Date,
  verified: {
    type: Boolean,
    default: false,
  },
  resetPasswordOtp: Number,
  resetPasswordOtpExpiry: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);
