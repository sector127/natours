const express = require('express');
const userController = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} = require('../controllers/authController');

const {
  getAllUsers,
  createUser,
  getUser,
  updateMe,
  updateUser,
  deleteUser,
  deactivateUser,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = userController;

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// After next line all routes are protected
router.use(protect);

router.patch('/updatePassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deactivateUser);

// After next line routes are restricted to certain users
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(restrictTo('admin'), deleteUser);

module.exports = router;
