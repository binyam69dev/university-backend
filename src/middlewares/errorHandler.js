import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
            error: 'Duplicate entry',
            message: 'A record with this information already exists'
        });
    }

    // Validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation Error',
            message: err.message 
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            error: 'Invalid token',
            message: 'Authentication token is invalid'
        });
    }

    // Default error
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : err.message;

    res.status(status).json({ 
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};