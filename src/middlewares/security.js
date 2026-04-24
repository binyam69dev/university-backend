import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss';
import  pool  from '../config/database.js';

// Rate limiting by role
export const roleRateLimiter = (role, maxRequests, windowMs) => {
    return rateLimit({
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => `${role}:${req.user?.id || req.ip}`,
        skip: (req) => req.user?.role !== role,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests',
                message: `Rate limit exceeded for ${role} role. Max ${maxRequests} requests per ${windowMs / 1000} seconds.`
            });
        }
    });
};

// Audit logging middleware
export const auditLog = async (req, res, next) => {
    const start = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    const originalJson = res.json;
    
    // Track if response has been sent
    let responseSent = false;
    
    res.json = function(data) {
        responseSent = true;
        originalJson.call(this, data);
    };
    
    res.end = function() {
        if (!responseSent) {
            responseSent = true;
        }
        originalEnd.call(this);
    };
    
    res.on('finish', async () => {
        const duration = Date.now() - start;
        
        // Only log if we have user info and it's a significant endpoint
        if (req.user?.id && (req.method !== 'GET' || res.statusCode >= 400)) {
            try {
                const logData = {
                    user_id: req.user.id,
                    action: `${req.method} ${req.route?.path || req.url}`,
                    method: req.method,
                    endpoint: req.url,
                    status_code: res.statusCode,
                    duration_ms: duration,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    request_body: req.method !== 'GET' ? JSON.stringify(req.body || {}) : null
                };
                
                // Store in database (non-blocking)
                pool.execute(
                    `INSERT INTO audit_logs (user_id, action, entity_type, ip_address, new_values) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [logData.user_id, logData.action, 'API', logData.ip_address, JSON.stringify(logData)]
                ).catch(err => console.error('Audit log error:', err.message));
            } catch (error) {
                // Don't let audit logging break the response
                console.error('Audit log error:', error.message);
            }
        }
    });
    
    next();
};

// Data sanitization (XSS protection)
export const sanitizeInput = (req, res, next) => {
    if (req.body) {
        const sanitizeObject = (obj) => {
            if (!obj) return obj;
            if (typeof obj === 'string') {
                return xss(obj.trim());
            }
            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }
            if (typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeObject(value);
                }
                return sanitized;
            }
            return obj;
        };
        
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = xss(req.query[key].trim());
            }
        }
    }
    
    next();
};

// CSP Headers
export const cspHeaders = helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws://localhost:5000", "wss://*.yourdomain.com"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
    }
});

// SQL Injection prevention (basic)
export const preventSQLInjection = (req, res, next) => {
    const sqlPatterns = /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b|\b--\b|;)/i;
    
    const checkValue = (value) => {
        if (typeof value === 'string' && sqlPatterns.test(value)) {
            return true;
        }
        return false;
    };
    
    // Check request body
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (checkValue(value)) {
                return res.status(400).json({ 
                    error: 'Invalid input detected',
                    message: 'SQL injection patterns are not allowed'
                });
            }
        }
    }
    
    next();
};