// Application fee configuration helper.
// The fee amount and whether it is enabled are stored as WebsiteSetting rows in
// Neon, editable by the founder/admin via the admin settings panel.

import prisma from "./db";

export const FEE_KEY = "app.applicationFee";
export const FEE_ENABLED_KEY = "app.applicationFeeEnabled";

// Temporary UPI QR payment method configuration (admin-managed WebsiteSetting rows).
// These keys describe how the applicant pays today. When Razorpay is added later,
// the paymentMethod below can switch to "razorpay" and the frontend will branch,
// while the fee amount continues to be controlled by app.applicationFee.
export const UPI_QR_URL_KEY = "app.upiQrUrl";
export const UPI_VPA_KEY = "app.upiVpa";
export const UPI_INSTRUCTIONS_KEY = "app.upiInstructions";
export const PAYMENT_METHOD_KEY = "app.paymentMethod";

export interface UpiPaymentConfig {
  qrUrl: string;
  vpa: string;
  instructions: string;
}

export interface ApplicationFeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
  // Payment method currently in use ("upi" for now; "razorpay" in the future).
  paymentMethod: "upi" | "razorpay";
  upi?: UpiPaymentConfig;
}

export async function getApplicationFeeConfig(): Promise<ApplicationFeeConfig> {
  const rows = await prisma.websiteSetting.findMany({
    where: {
      key: { in: [FEE_KEY, FEE_ENABLED_KEY, UPI_QR_URL_KEY, UPI_VPA_KEY, UPI_INSTRUCTIONS_KEY, PAYMENT_METHOD_KEY] },
    },
  });
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.isSecret) map[r.key] = r.value || "";
  }
  const amount = Number(map[FEE_KEY]);
  const enabled = map[FEE_ENABLED_KEY] !== "false";
  const paymentMethod: ApplicationFeeConfig["paymentMethod"] = map[PAYMENT_METHOD_KEY] === "razorpay" ? "razorpay" : "upi";
  const upi: UpiPaymentConfig | undefined =
    map[UPI_QR_URL_KEY] || map[UPI_VPA_KEY]
      ? {
          qrUrl: map[UPI_QR_URL_KEY] || "",
          vpa: map[UPI_VPA_KEY] || "",
          instructions: map[UPI_INSTRUCTIONS_KEY] || "",
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
