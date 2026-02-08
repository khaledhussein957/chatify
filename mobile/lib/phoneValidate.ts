const OPERATORS = {
  Hormuud: {
    name: "Hormuud Telecom Somalia",
    prefixes: ["61", "77"],
  },
  Somtel: {
    name: "Somtel Somalia",
    prefixes: ["62", "65", "68"],
  },
  Telesom: {
    name: "Telesom Somalia",
    prefixes: ["63"],
  },
  Golis: {
    name: "Golis Telecom Somalia",
    prefixes: ["79", "90"],
  },
  Somafone: {
    name: "Somafone",
    prefixes: ["69"],
  },
  NationLink: {
    name: "NationLink Telecom",
    prefixes: ["66"],
  },
};

const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("252")) {
    cleaned = cleaned.slice(3);
  }
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

export const validatePhoneNumber = (phone: string) => {
  try {
    if (!isValidSomaliMobile(phone)) {
      return { valid: false, message: "Invalid phone number format" };
    }

    const operatorName = getOperator(phone);
    if (!operatorName) {
      return { valid: false, message: "Unknown mobile operator" };
    }

    const operatorInfo = (OPERATORS as any)[operatorName];

    console.log(
      `Phone number ${phone} is valid and belongs to ${operatorInfo.name}`,
    );

    return {
      valid: true,
      operator: operatorInfo.name,
      country: operatorInfo.prefixes,
      message: "Valid phone number",
    };
  } catch {
    return {
      valid: false,
      message: "Phone validation failed",
    };
  }
};
