const fs = require('fs');
const util = require('util');
const multer = require('multer');
const Jimp = require('jimp');
const User = require('../models/userModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const photo = await Jimp.read(req.file.buffer);
  const width = photo.getWidth();
  const height = photo.getHeight();

  // Calculate dimensions for center cropping
  const cropWidth = Math.min(width, 500);
  const cropHeight = Math.min(height, 500);
  const x = width > 500 ? (width - cropWidth) / 2 : 0;
  const y = height > 500 ? (height - cropHeight) / 2 : 0;

  const buffer = await photo
    .crop(x, y, cropWidth, cropHeight) // Resize to 500x500
    .quality(90) // Set JPEG quality
    .getBufferAsync(Jimp.MIME_JPEG); // Convert to JPEG format

  req.file.buffer = buffer;
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;
  req.file.mimetype = Jimp.MIME_JPEG;

  const filePath = `public/img/users/${req.file.filename}`;
  fs.writeFileSync(filePath, buffer);

  next(); // Move to the next middleware or route handler
});

const deleteUserPhotoServer = async (photo) => {
  if (photo.startsWith('default')) return;

  const path = `${__dirname}/../public/img/users/${photo}`;
  const unlink = util.promisify(fs.unlink);

  try {
    await unlink(path);
  } catch (error) {
    console.log(error);
  }
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) If uploading new photo, delete the old one from the server.
  if (req.file) await deleteUserPhotoServer(req.user.photo);

  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deactivateUser = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = getOne(User);
exports.getAllUsers = getAll(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
