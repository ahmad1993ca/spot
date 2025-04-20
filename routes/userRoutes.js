const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require('../config/upload'); // multer config

router.post("/sendOtp", userController.sendOtp);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/register", userController.register);
router.post("/login", userController.login);

router.post('/profile', upload.single('image'), userController.profile);
module.exports = router;




