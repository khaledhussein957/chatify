export const isValidStrongPassword = (password: string): boolean => {
  const upper = (password.match(/[A-Z]/g) || []).length;
  const lower = (password.match(/[a-z]/g) || []).length;
  const digits = (password.match(/[0-9]/g) || []).length;
  const symbols = (password.match(/[^A-Za-z0-9]/g) || []).length;

  return (
    password.length >= 8 &&
    upper >= 2 &&
    lower >= 2 &&
    digits >= 2 &&
    symbols >= 2
  );
};
