// Application fee configuration helper.
// The fee amount and whether it is enabled are stored as WebsiteSetting rows in
// Neon, editable by the founder/admin via the admin settings panel.

import prisma from "./db";

export const FEE_KEY = "app.applicationFee";
export const FEE_ENABLED_KEY = "app.applicationFeeEnabled";

// Payment configuration for the temporary manual UPI flow (admin-managed
// WebsiteSetting rows). The applicant scans the admin-uploaded QR and enters
// their UPI transaction reference; an admin verifies it before the application
// is fully processed. When Razorpay is added later, paymentMethod switches to
// "razorpay" and the frontend branches, while the fee amount continues to be
// controlled by app.applicationFee.
export const UPI_QR_URL_KEY = "app.upiQrUrl";
export const UPI_QR_KEY = "app.upiQrKey";
export const UPI_QR_MIME_KEY = "app.upiQrMime";
export const UPI_QR_PROVIDER_KEY = "app.upiQrProvider";
export const UPI_VPA_KEY = "app.upiVpa";
export const UPI_INSTRUCTIONS_KEY = "app.upiInstructions";
export const PAYMENT_METHOD_KEY = "app.paymentMethod";

export const UPI_QR_STORAGE_KEYS = [UPI_QR_KEY, UPI_QR_MIME_KEY, UPI_QR_PROVIDER_KEY];

export type PaymentMethodValue = "manual_upi" | "razorpay";

export interface UpiPaymentConfig {
  vpa: string;
  instructions: string;
  // true when a QR has been uploaded (or a legacy public QR URL exists)
  qrConfigured: boolean;
  // Relative API path to the authenticated QR endpoint when configured, else ""
  qrUrl: string;
}

export interface ApplicationFeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
  // Payment method currently in use ("manual_upi" for now; "razorpay" in the future).
  paymentMethod: PaymentMethodValue;
  upi?: UpiPaymentConfig;
}

export async function getApplicationFeeConfig(): Promise<ApplicationFeeConfig> {
  const rows = await prisma.websiteSetting.findMany({
    where: {
      key: {
        in: [
          FEE_KEY,
          FEE_ENABLED_KEY,
          UPI_QR_URL_KEY,
          UPI_QR_KEY,
          UPI_VPA_KEY,
          UPI_INSTRUCTIONS_KEY,
          PAYMENT_METHOD_KEY,
        ],
      },
    },
  });
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.isSecret) map[r.key] = r.value || "";
  }
  const amount = Number(map[FEE_KEY]);
  const enabled = map[FEE_ENABLED_KEY] !== "false";
  const rawMethod = (map[PAYMENT_METHOD_KEY] || "").trim().toLowerCase();
  // Normalise the legacy "upi" value to the current "manual_upi" value.
  const paymentMethod: PaymentMethodValue =
    rawMethod === "razorpay" ? "razorpay" : "manual_upi";

  // An uploaded QR (app.upiQrKey) takes precedence. The legacy app.upiQrUrl
  // (a public image URL) keeps working as a fallback for already-configured URLs.
  const qrStored = map[UPI_QR_KEY]?.trim() ? true : false;
  const legacyQrUrl = (map[UPI_QR_URL_KEY] || "").trim();
  const qrConfigured = qrStored || /^https?:\/\//i.test(legacyQrUrl);

  const upi: UpiPaymentConfig | undefined =
    qrConfigured || map[UPI_VPA_KEY]?.trim()
      ? {
          vpa: map[UPI_VPA_KEY] || "",
          instructions: map[UPI_INSTRUCTIONS_KEY] || "",
          qrConfigured,
          qrUrl: qrConfigured ? "/api/payments/upi-qr" : "",
        }
      : undefined;

  return {
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    enabled,
    currency: "INR",
    paymentMethod,
    upi,
  };
}