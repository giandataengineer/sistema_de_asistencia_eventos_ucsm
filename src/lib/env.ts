const REQUIRED_VARS = ["DATABASE_URL", "JWT_SECRET"] as const;

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno requeridas no configuradas: ${missing.join(", ")}`
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET === "ucsm-asistencia-secret-change-in-production"
  ) {
    throw new Error(
      "JWT_SECRET debe cambiarse del valor por defecto en produccion"
    );
  }
}

validateEnv();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
