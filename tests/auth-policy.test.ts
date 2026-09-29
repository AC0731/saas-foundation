import { describe, expect, it } from "vitest";
import {
  decideCredentialAction,
  validateCredentialInput,
} from "../lib/auth-policy";

describe("credential authentication policy", () => {
  it("never lets sign-in claim an existing passwordless account", () => {
    expect(
      decideCredentialAction({
        mode: "signin",
        userExists: true,
        hasPasswordHash: false,
      })
    ).toBe("deny");
  });

  it("only creates a credentials account for an unused email in signup mode", () => {
    expect(
      decideCredentialAction({
        mode: "signup",
        userExists: false,
        hasPasswordHash: false,
      })
    ).toBe("create");

    expect(
      decideCredentialAction({
        mode: "signup",
        userExists: true,
        hasPasswordHash: false,
      })
    ).toBe("deny");
  });

  it("requires password verification for an existing credentials account", () => {
    expect(
      decideCredentialAction({
        mode: "signin",
        userExists: true,
        hasPasswordHash: true,
      })
    ).toBe("verify");
  });

  it("enforces stronger signup passwords without trimming password content", () => {
    const password = "  correct horse battery staple  ";
    const result = validateCredentialInput({
      email: " User@Example.com ",
      password,
      mode: "signup",
    });

    expect(result.valid).toBe(true);
    expect(result.email).toBe("user@example.com");
    expect(result.password).toBe(password);

    expect(
      validateCredentialInput({
        email: "user@example.com",
        password: "short",
        mode: "signup",
      }).valid
    ).toBe(false);
  });
});
