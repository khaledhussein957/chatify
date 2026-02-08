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

export const resendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  deviceId: Joi.string().optional(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  resetCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string()
    .min(8)
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Passwords must match",
    }),
});

export const resendCodeSchema = Joi.object({
  email: Joi.string().email().required(),
});
