// Startup validation - runs once when the first API route is called
import { validateEnv } from "./env";

// Required environment variables for the app to function
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
];

let validated = false;

export function validateStartup() {
  if (!validated) {
    validateEnv(REQUIRED_ENV_VARS);
    validated = true;
    console.log("✅ Environment validation passed - all required vars present");
  }
}
