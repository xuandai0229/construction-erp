let validated = false;

function requireProductionEnv(name: string, minLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`${name} must be configured for production runtime.`);
  }
}

export function validateRuntimeEnv() {
  if (validated) return;
  if (process.env.NODE_ENV === "production") {
    requireProductionEnv("DATABASE_URL");
    requireProductionEnv("SESSION_SECRET", 32);
    requireProductionEnv("INTERNAL_SYSTEM_TOKEN", 32);
  }
  validated = true;
}
