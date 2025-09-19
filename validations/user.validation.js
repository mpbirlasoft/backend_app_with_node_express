import { body } from 'express-validator';

exports.registerValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password too short'),
  body('name').notEmpty().withMessage('Name is required')
];
