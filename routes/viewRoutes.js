const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getMyTours,
  getSignupForm,
  getBestCheapest,
  getForgotPassword,
  getGetResetPassword,
} = require('../controllers/viewsController');
const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignupForm);
router.get('/forgot-password', getForgotPassword);
router.get('/reset-password/:token', getGetResetPassword);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);
router.get('/top-5-cheap', isLoggedIn, getBestCheapest);

module.exports = router;
