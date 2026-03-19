export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function requireEnvNumber(name: string): number {
  const raw = requireEnv(name);
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number value for environment variable ${name}: ${raw}`);
  }
  return parsed;
}

export function requireEnvBoolean(name: string): boolean {
  const raw = requireEnv(name).toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  throw new Error(`Invalid boolean value for environment variable ${name}: ${raw}`);
}

export function validateEnv(names: string[]) {
  names.forEach(requireEnv);
}
