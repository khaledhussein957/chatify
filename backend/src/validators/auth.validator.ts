import Joi from "joi";

export const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required()
    .max(15)
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 9-15 digits",
    }),
});

export const verifyCode = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required(),
  code: Joi.string().length(6).required(),
  deviceId: Joi.string().optional(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
});

export const resendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required(),
});
