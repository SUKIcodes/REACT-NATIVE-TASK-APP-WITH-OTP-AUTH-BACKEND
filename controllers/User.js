const User = require("../models/User");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "emailtestingscam@gmail.com",
    pass: "dbpdwpixluuhwuca",
  },
});

const register = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already registered" });
    }
    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });
    const otp = Math.floor(Math.random() * 1000000);
    let details = {
      from: "emailtestingscam@gmail.com",
      to: email,
      subject: "KING :: Account Verification OTP",
      text: `Dear ${name}, Please use ${otp} to validate your Email ID. This OTP is valid for 3 minutes. \n Kindly ignore if not requested. \n\n\n Regards\n KING
      `,
    };
    mailTransporter.sendMail(details);

    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRY * 60 * 1000), // 3 minutes
    });
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res
      .cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      })
      .status(201)
      .json({
        success: true,
        message: `Email sent to ${user.email} for Account verification. Kindly verify.`,
        user,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verify = async (req, res) => {
  try {
    const otp = Number(req.body.otp);
    let user = await User.findById(req.user._id);
    if (user.otp !== otp || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid otp or has expired." });
    }
    user.verified = true;
    user.otp_expiry = null;
    user.otp = null;
    await user.save();
    res.status(200).json({ success: true, message: "Account Verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Enter All Fields." });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res
      .cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      })
      .status(201)
      .json({
        success: true,
        message: "Logged In Successfully",
        user,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(Date.now()),
      })
      .status(200)
      .json({
        success: true,
        message: "Logged Out successfully",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    let user = await User.findById(req.user._id);
    user.tasks.push({
      title,
      description,
      completed: false,
      createdAt: new Date(Date.now()),
    });
    await user.save();
    res.status(200).json({ success: true, message: "Task Added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = await User.findById(req.user._id);
    user.tasks = user.tasks.filter(
      (task) => task._id.toString() !== taskId.toString()
    );
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Task successfully removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    let user = await User.findById(req.user._id);
    user.task = user.tasks.find(
      (task) => task._id.toString() === taskId.toString()
    );
    user.task.completed = !user.task.completed;
    res.status(200).json({ success: true, message: "Task updated removed" });
    await user.save();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    res
      .status(200)
      .json({ success: true, message: `Welcome ${user.name}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    const { name, avatar } = req.body;
    if (name) {
      user.name = name;
    }
    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
      });
      user.avatar.public_id = myCloud.public_id;
      user.avatar.url = myCloud.secure_url;
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Enter All Fields." });
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Old Password." });
    }
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Enter your email address..." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address" });
    }
    const otp = Math.floor(Math.random() * 1000000);
    let details = {
      from: "emailtestingscam@gmail.com",
      to: email,
      subject: "KING :: Password Reset OTP",
      text: `Dear ${user.name}, Please use ${otp} to reset your password. This OTP is valid for 3 minutes. \n Kindly ignore if not requested. \n\n\n Regards\n KING
      `,
    };
    mailTransporter.sendMail(details);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = new Date(
      Date.now() + process.env.OTP_EXPIRY * 60 * 1000
    );
    await user.save();
    res.status(200).json({ success: true, message: `OTP sent to ${email}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Enter All Fields." });
    }
    const user = await User.findOne({
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or is incorrect." });
    }
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;
    res.status(200).json({ success: true, message: "Password changed ." });
    await user.save();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  verify,
  login,
  logout,
  addTask,
  removeTask,
  updateTask,
  getMyProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
};
