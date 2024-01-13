const fs = require('fs');
const util = require('util');
const multer = require('multer');
const Jimp = require('jimp');

const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // Cover image
  const coverPhoto = await Jimp.read(req.files.imageCover[0].buffer);
  const coverBuffer = await coverPhoto
    .resize(2000, 1333)
    .quality(90)
    .getBufferAsync(Jimp.MIME_JPEG);

  req.body.imageCover = `tour-${req.params.id}-cover.jpeg`;
  req.files.imageCover[0].buffer = coverBuffer;
  req.files.imageCover[0].mimetype = Jimp.MIME_JPEG;
  const coverFilePath = `public/img/tours/${req.body.imageCover}`;
  fs.writeFileSync(coverFilePath, coverBuffer);

  // Tour images
  req.body.images = [];
  for (let i = 0; i < req.files.images.length; i++) {
    const file = req.files.images[i];
    const filename = `tour-${req.params.id}-${i + 1}.jpeg`;

    const tourPhoto = await Jimp.read(file.buffer);
    const { width, height } = tourPhoto.bitmap;

    let resizedBuffer;
    if (width > height) {
      // Landscape image: Resize without distortion
      resizedBuffer = await tourPhoto
        .resize(2000, Jimp.AUTO) // Resize width to 2000 pixels, keep aspect ratio
        .quality(90)
        .getBufferAsync(Jimp.MIME_JPEG);
    } else {
      // Portrait image: Resize and crop to cover 2000x1333 without distortion
      resizedBuffer = await tourPhoto
        .cover(2000, 1333) // Resize and crop to cover the specified dimensions
        .quality(90)
        .getBufferAsync(Jimp.MIME_JPEG);
    }

    req.files.images[i].buffer = resizedBuffer;
    req.files.images[i].mimetype = Jimp.MIME_JPEG;
    const tourFilePath = `public/img/tours/${filename}`;
    fs.writeFileSync(tourFilePath, resizedBuffer);
    req.body.images.push(filename);
  }

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = getAll(Tour);
exports.createTour = createOne(Tour);
exports.getTour = getOne(Tour, { path: 'reviews' });
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: 'price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude.', 404));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude.', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
