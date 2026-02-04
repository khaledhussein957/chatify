import Joi from "joi";

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required().messages({
    "string.empty": "Current password is required",
    "string.min": "Password must be at least 8 characters",
  }),

  newPassword: Joi.string()
    .min(8)
    .required()
    .invalid(Joi.ref("currentPassword"))
    .messages({
      "string.empty": "New password is required",
      "string.min": "Password must be at least 8 characters",
      "any.invalid": "New password must be different from current password",
    }),

  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
});
