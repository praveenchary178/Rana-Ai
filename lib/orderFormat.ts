import type { PillTone } from "@/components/StatusPill";
import type { PaymentStatus } from "./anFarmsOrders";

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending_call: "Pending call",
  called_no_payment: "Called, no payment",
  payment_collected: "Payment collected",
  cancelled: "Cancelled",
};
export const PAYMENT_TONE: Record<PaymentStatus, PillTone> = {
  pending_call: "warm",
  called_no_payment: "hot",
  payment_collected: "signal",
  cancelled: "neutral",
};
export const PAYMENT_ORDER: PaymentStatus[] = ["pending_call", "called_no_payment", "payment_collected", "cancelled"];
