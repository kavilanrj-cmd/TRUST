// Application fee configuration helper.
// The fee amount and whether it is enabled are stored as WebsiteSetting rows in
// Neon, editable by the founder/admin via the admin settings panel.

import prisma from "./db";

export const FEE_KEY = "app.applicationFee";
export const FEE_ENABLED_KEY = "app.applicationFeeEnabled";

export interface ApplicationFeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
}

export async function getApplicationFeeConfig(): Promise<ApplicationFeeConfig> {
  const rows = await prisma.websiteSetting.findMany({
    where: { key: { in: [FEE_KEY, FEE_ENABLED_KEY] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.isSecret) map[r.key] = r.value || "";
  }
  const amount = Number(map[FEE_KEY]);
  const enabled = map[FEE_ENABLED_KEY] !== "false";
  return {
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    enabled,
    currency: "INR",
  };
}
