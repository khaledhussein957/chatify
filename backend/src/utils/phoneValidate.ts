import {
  isValidSomaliMobile,
  getOperator,
  getOperatorInfo,
  SomaliPhoneError,
} from "sophone";

export const validatePhoneNumber = (phone: string) => {
  try {
    if (!isValidSomaliMobile(phone)) {
      return { valid: false, message: "Invalid phone number format" };
    }

    const operator = getOperator(phone);
    if (!operator) {
      return { valid: false, message: "Unknown mobile operator" };
    }

    const operatorInfo = getOperatorInfo(phone);
    if (!operatorInfo) {
      return {
        valid: false,
        message: "Could not retrieve operator information",
      };
    }

    console.log(
      `Phone number ${phone} is valid and belongs to ${operatorInfo.name}`,
    );

    return {
      valid: true,
      operator: operatorInfo.name,
      country: operatorInfo.prefixes,
      message: "Valid phone number",
    };
  } catch (error) {
    if (error instanceof SomaliPhoneError) {
      console.log(error.code); // ERROR_CODES.INVALID_PREFIX
      console.log(error.message); // Descriptive message
    }
  }
};
