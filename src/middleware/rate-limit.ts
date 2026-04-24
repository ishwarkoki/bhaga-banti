import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

// General rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    message: 'ଅନେକ ଅନୁରୋଧ, ଦୟାକରି ପରେ ପୁନଃଚେଷ୍ଟା କରନ୍ତୁ',
  },
});

// Auth rate limiter (stricter)
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.auth.windowMs,
  max: RATE_LIMITS.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    message: 'ଅନେକ ପ୍ରାମାଣିକରଣ ଚେଷ୍ଟା, ଦୟାକରି ପରେ ପୁନଃଚେଷ୍ଟା କରନ୍ତୁ',
  },
});

// Invite rate limiter
export const inviteRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.invites.windowMs,
  max: RATE_LIMITS.invites.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many invite requests, please try again later',
    message: 'ଅନେକ ଆମନ୍ତ୍ରଣ ଅନୁରୋଧ, ଦୟାକରି ପରେ ପୁନଃଚେଷ୍ଟା କରନ୍ତୁ',
  },
});
