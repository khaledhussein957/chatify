const OPERATORS = {
  Hormuud: {
    name: "Hormuud Telecom Somalia",
    prefixes: ["61", "77"],
    website: "https://hormuud.com",
    type: "GSM",
    wallet: "EVC",
    isOtpSupported: true,
  },
  Somtel: {
    name: "Somtel Somalia",
    prefixes: ["62", "65", "68"],
    website: "https://somtel.com",
    type: "GSM",
    wallet: "eDahab",
    isOtpSupported: false,
  },
  Telesom: {
    name: "Telesom Somalia",
    prefixes: ["63"],
    website: "https://telesom.com",
    type: "GSM",
    wallet: "Zaad",
    isOtpSupported: true,
  },
  Golis: {
    name: "Golis Telecom Somalia",
    prefixes: ["79", "90"],
    website: "https://golistelecom.com",
    type: "GSM",
    wallet: "SAHAL",
    isOtpSupported: false,
  },
  Somafone: {
    name: "Somafone",
    prefixes: ["69"],
    website: "https://somafone.com",
    type: "GSM",
    wallet: "Somafone",
    isOtpSupported: false,
  },
  NationLink: {
    name: "NationLink Telecom",
    prefixes: ["66"],
    website: "https://nationlinktelecom.com",
    type: "GSM",
    wallet: "NationLink",
    isOtpSupported: false,
  },
};

const normalizePhone = (phone: string): string => {
  // Remove spaces, +, and other separators
  let cleaned = phone.replace(/[^\d]/g, "");

  // Remove country code if present
  if (cleaned.startsWith("252")) {
    cleaned = cleaned.slice(3);
  }

  // Remove leading zero if present
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
};

export const isValidSomaliMobile = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 9) return false;

  const prefix = normalized.slice(0, 2);
  return Object.values(OPERATORS).some((op) => op.prefixes.includes(prefix));
};

export const getOperator = (phone: string): string | null => {
  const normalized = normalizePhone(phone);
  const prefix = normalized.slice(0, 2);

  for (const [name, info] of Object.entries(OPERATORS)) {
    if (info.prefixes.includes(prefix)) {
      return name;
    }
  }

  return null;
};

export const getOperatorInfo = (phone: string) => {
  const normalized = normalizePhone(phone);
  const prefix = normalized.slice(0, 2);

  for (const info of Object.values(OPERATORS)) {
    if (info.prefixes.includes(prefix)) {
      return info;
    }
  }

  return null;
};

export const isOtpSupported = (phone: string): boolean => {
  const info = getOperatorInfo(phone);
  return info ? info.isOtpSupported : false;
};

export const validatePhoneNumber = async (phone: string) => {
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
    console.error("Unexpected phone validation error:", error);
    return { valid: false, message: "Phone validation failed" };
  }
};
