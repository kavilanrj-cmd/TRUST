// Client-side login identifier rules.
//
// The only supported login identifiers are an email address or an Indian mobile
// number. There is no username: the platform has no username field and never
// accepts one.
//
// The backend owns the authoritative version of these rules
// (`backend/src/utils/loginIdentity.ts`); this mirrors them so the applicant gets
// immediate feedback, while the server still re-checks everything it receives.

export const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian mobile numbers are 10 digits starting 6-9.
export const MOBILE_RX = /^[6-9][0-9]{9}$/;

export const IDENTIFIER_LABEL = "Email or Mobile Number";
export const IDENTIFIER_PLACEHOLDER = "Enter your email or mobile number";
export const IDENTIFIER_REQUIRED_MESSAGE = "Email or mobile number is required.";
export const INVALID_IDENTIFIER_MESSAGE =
  "Please enter a valid email address or mobile number.";

// Reduce any accepted spelling of an Indian mobile number to the bare 10 digits.
// A country code (+91 / 91 / 0091), spaces, dashes, dots and brackets are all
// tolerated. Returns null when the value is not a usable mobile number.
export function normalizeMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  // "91" and "+91" contribute 2 digits, the "0091" prefix 4.
  const national =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 14 && digits.startsWith("0091")
        ? digits.slice(4)
        : digits;
  return MOBILE_RX.test(national) ? national : null;
}

// True when the value can be used as a login identifier. An "@" means the value
// is meant to be an email address and must pass the email check outright; it is
// never retried as a number.
export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) return EMAIL_RX.test(trimmed);
  return normalizeMobile(trimmed) !== null;
}
