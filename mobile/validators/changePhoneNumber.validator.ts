import Joi from "joi";

export const changePhoneNumberSchema = Joi.object({
  oldPhone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required()
    .max(15)
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 9-15 digits",
    }),

  newPhone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required()
    .max(15)
    .invalid(Joi.ref("oldPhone"))
    .messages({
      "any.invalid": "New phone number must be different from old phone number",
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 9-15 digits",
    }),
});
