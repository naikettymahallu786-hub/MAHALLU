import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { logger, stream } from './config/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import familyRoutes from './routes/family.routes';
import mosqueRoutes from './routes/mosque.routes';
import madrasaRoutes from './routes/madrasa.routes';
import classRoutes from './routes/class.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import attendanceRoutes from './routes/attendance.routes';
import homeworkRoutes from './routes/homework.routes';
import examRoutes from './routes/exam.routes';
import paymentRoutes from './routes/payment.routes';
import donationRoutes from './routes/donation.routes';
import propertyRoutes from './routes/property.routes';
import zakatRoutes from './routes/zakat.routes';
import nikahRoutes from './routes/nikah.routes';
import deathRoutes from './routes/death.routes';
import cemeteryRoutes from './routes/cemetery.routes';
import eventRoutes from './routes/event.routes';
import certificateRoutes from './routes/certificate.routes';
import notificationRoutes from './routes/notification.routes';
import surveyRoutes from './routes/survey.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import auditRoutes from './routes/audit.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';
import mobileRoutes from './routes/mobile.routes';
import registrationRoutes from './routes/registration.routes';
import inboxRoutes from './routes/inbox.routes';
import financeRoutes from './routes/finance.routes';
import receiptRoutes from './routes/receipt.routes';

export function createApp(): Application {
  const app = express();
  const httpServer = createServer(app);

  // ---- Socket.io ----
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Attach io to app for use in routes
  app.set('io', io);

  // Socket.io connection handler
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-tenant', (tenantId: string) => {
      socket.join(`tenant-${tenantId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // ---- Security Middleware ----
  app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://*.razorpay.com"],
        scriptSrcElem: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://*.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'res.cloudinary.com', "https://*.razorpay.com"],
        connectSrc: ["'self'", "https://*.razorpay.com", "wss://*.razorpay.com"],
        frameSrc: ["'self'", "https://*.razorpay.com"],
        formAction: ["'self'", "https://*.razorpay.com", "https://api.razorpay.com"],
      },
    },
  }));

  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'https://mahallu.app',
        'https://mahallu-dashbaord-five.vercel.app',  
        'https://mahallu-backend-clae.onrender.com',
        /\.mahallu\.app$/,
        /\.vercel\.app$/,
      ];
      if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  }));

  // ---- General Middleware ----
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  
  // Custom middleware to clean empty string inputs to undefined to prevent Mongoose cast errors (e.g. for ObjectIds/Dates)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const clean = (obj: any) => {
        for (const key in obj) {
          if (obj[key] === '') {
            delete obj[key];
          } else if (obj[key] && typeof obj[key] === 'object') {
            clean(obj[key]);
          }
        }
      };
      clean(req.body);
    }
    next();
  });

  app.use(morgan('combined', { stream }));
  app.use(requestLogger);

  // ---- Rate Limiting ----
  app.use('/api/', globalRateLimiter);

  // ---- Health Check ----
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Mahallu ERP API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // ---- API Routes ----
  const API_V1 = '/api/v1';

  app.use(`${API_V1}/auth`, authRoutes);
  app.use(`${API_V1}/dashboard`, dashboardRoutes);
  app.use(`${API_V1}/members`, memberRoutes);
  app.use(`${API_V1}/families`, familyRoutes);
  app.use(`${API_V1}/mosque`, mosqueRoutes);
  app.use(`${API_V1}/madrasa`, madrasaRoutes);
  app.use(`${API_V1}/classes`, classRoutes);
  app.use(`${API_V1}/students`, studentRoutes);
  app.use(`${API_V1}/teachers`, teacherRoutes);
  app.use(`${API_V1}/attendance`, attendanceRoutes);
  app.use(`${API_V1}/homework`, homeworkRoutes);
  app.use(`${API_V1}/exams`, examRoutes);
  app.use(`${API_V1}/payments`, paymentRoutes);
  app.use(`${API_V1}/donations`, donationRoutes);
  app.use(`${API_V1}/properties`, propertyRoutes);
  app.use(`${API_V1}/zakat`, zakatRoutes);
  app.use(`${API_V1}/nikah`, nikahRoutes);
  app.use(`${API_V1}/death`, deathRoutes);
  app.use(`${API_V1}/cemetery`, cemeteryRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/certificates', certificateRoutes);
  app.use('/api/v1/surveys', surveyRoutes);
  app.use('/api/v1/inbox', inboxRoutes);
  app.use('/api/v1/finance', financeRoutes);
  app.use('/api/v1/receipts', receiptRoutes);
  app.use('/api/v1/notices', notificationRoutes);

  // 4. API Routes - Dashboard/Mobile Aggregation
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use(`${API_V1}/reports`, reportRoutes);
  app.use(`${API_V1}/upload`, uploadRoutes);
  app.use(`${API_V1}/whatsapp`, whatsappRoutes);
  app.use(`${API_V1}/audit-logs`, auditRoutes);
  app.use(`${API_V1}/settings`, settingsRoutes);
  app.use(`${API_V1}/mobile`, mobileRoutes);
  app.use(`${API_V1}/registrations`, registrationRoutes);

  // ---- 404 & Error Handlers ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return httpServer as unknown as Application;
}
