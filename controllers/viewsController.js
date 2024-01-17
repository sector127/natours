const { default: axios } = require('axios');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
// const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name!', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login');
};

exports.getSignupForm = (req, res, next) => {
  res.status(200).render('signup');
};

exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});

exports.getBestCheapest = catchAsync(async (req, res) => {
  const results = await axios({
    method: 'GET',
    url: `${req.protocol}://${req.get('host')}/api/v1/tours/top-5-cheap`,
  });
  const tours = results.data.data.doc;
  res.status(200).render('overview', {
    title: 'Our 5 best affordable tours',
    tours,
  });
});

exports.getForgotPassword = catchAsync(async (req, res) => {
  res.status(200).render('forgotPassword');
});
