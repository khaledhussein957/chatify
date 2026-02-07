import generator from "generate-password";

export const generateStrongPassword = (): string => {
  let password: string;

  const isValidPassword = (password: string) => {
    const upper = (password.match(/[A-Z]/g) || []).length;
    const lower = (password.match(/[a-z]/g) || []).length;
    const digits = (password.match(/[0-9]/g) || []).length;
    const symbols = (password.match(/[^A-Za-z0-9]/g) || []).length;

    return upper >= 2 && lower >= 2 && digits >= 2 && symbols >= 2;
  };

  do {
    password = generator.generate({
      length: 12,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: true,
      strict: true,
    });
  } while (!isValidPassword(password));

  return password;
};
