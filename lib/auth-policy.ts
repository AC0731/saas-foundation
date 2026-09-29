export type CredentialMode = "signin" | "signup";
export type CredentialAction = "create" | "verify" | "deny";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_SIGNUP_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateCredentialInput({
  email,
  password,
  mode,
}: {
  email: string;
  password: string;
  mode: CredentialMode;
}) {
  const normalizedEmail = normalizeEmail(email);

  if (
    !normalizedEmail ||
    normalizedEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return {
      valid: false as const,
      email: normalizedEmail,
      password,
      reason: "invalid_email",
    };
  }

  if (!password || password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false as const,
      email: normalizedEmail,
      password,
      reason: "invalid_password",
    };
  }

  if (mode === "signup" && password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
    return {
      valid: false as const,
      email: normalizedEmail,
      password,
      reason: "weak_signup_password",
    };
  }

  return {
    valid: true as const,
    email: normalizedEmail,
    password,
  };
}

export function decideCredentialAction({
  mode,
  userExists,
  hasPasswordHash,
}: {
  mode: CredentialMode;
  userExists: boolean;
  hasPasswordHash: boolean;
}): CredentialAction {
  if (mode === "signup") {
    return userExists ? "deny" : "create";
  }

  if (!userExists || !hasPasswordHash) {
    return "deny";
  }

  return "verify";
}
