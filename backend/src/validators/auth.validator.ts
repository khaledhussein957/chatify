import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
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
