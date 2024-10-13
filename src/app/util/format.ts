export const userTwoChars = (username: string) => {
  if (username.length < 2) return username;

  const parts = username.split(" ");
  if (parts.length === 1) return username.slice(0, 2).toLocaleUpperCase();

  return parts[0][0].toLocaleUpperCase() + parts.at(-1)![0].toLocaleUpperCase();
};
