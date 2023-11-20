const express = require("express");
const {
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
} = require("../controllers/User");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

router.post("/register", register);
router.post("/verify", isAuthenticated, verify);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.post("/newtask", isAuthenticated, addTask);
router.delete("/task/:taskId", isAuthenticated, removeTask);
router.get("/task/:taskId", isAuthenticated, updateTask);
router.get("/me", isAuthenticated, getMyProfile);
router.put("/updateProfile", isAuthenticated, updateProfile);
router.put("/updatePassword", isAuthenticated, updatePassword);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword", resetPassword);

module.exports = router;
