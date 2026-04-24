import Joi from 'joi';

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ errors });
        }
        
        next();
    };
};

// Validation schemas
export const schemas = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),
    
    createUser: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'instructor', 'student').required(),
        firstName: Joi.string().max(100).required(),
        lastName: Joi.string().max(100).required()
    }),
    
    createCourse: Joi.object({
        courseCode: Joi.string().max(20).required(),
        title: Joi.string().max(255).required(),
        description: Joi.string().optional(),
        credits: Joi.number().integer().min(1).max(6).required(),
        capacity: Joi.number().integer().min(1).max(200).required(),
        semester: Joi.string().valid('Fall', 'Spring', 'Summer').required(),
        year: Joi.number().integer().min(2020).max(2030).required(),
        prerequisiteCourseId: Joi.number().integer().optional()
    }),
    
    updateGrade: Joi.object({
        score: Joi.number().min(0).max(100).required()
    })
};