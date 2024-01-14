const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const { webhookCheckout } = require('./controllers/bookingController');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(cors());
app.options('*', cors());
// Serving static files
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com',
  'https://m.stripe.network',
  'https://*.cloudflare.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
  'https://cdnjs.cloudflare.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.stripe.com',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
  'https://router.project-osrm.org',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", ...fontSrcUrls],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      formAction: ["'self'"],
      connectSrc: [
        "'self'",
        "'unsafe-inline'",
        'data:',
        'blob:',
        ...connectSrcUrls,
      ],
      upgradeInsecureRequests: [],
    },
  }),
);

// Body parser, reading data from body into req.body
app.use(bodyParser.json());
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitazation against NoSQL query injection
app.use(mongoSanitize());

// Data sanitazation against XSS
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(compression());

// Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRoutes);

// Handling unhandled routes (ALWAYS after handled routes!!!)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

// Global error handling middleware

app.use(globalErrorHandler);

module.exports = app;
