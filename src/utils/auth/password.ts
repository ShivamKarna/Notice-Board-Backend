async function hashPassword(password: string): Promise<string> {
  const hashed = Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
  return hashed;
}
async function comparePassword(
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await Bun.password.verify(inputPassword, hashedPassword);
}

export { hashPassword, comparePassword };
