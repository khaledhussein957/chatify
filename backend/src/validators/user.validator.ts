import Joi from "joi";

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string()
    .min(8)
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Passwords must match",
    }),
});

export const updatePhoneSchema = Joi.object({
  oldPhone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .max(15),

  newPhone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .max(15)
    .invalid(Joi.ref("oldPhone"))
    .messages({
      "any.invalid": "New phone number must be different from old phone number",
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10-15 digits",
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
});
