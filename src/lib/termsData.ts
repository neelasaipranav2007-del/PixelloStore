export const CURRENT_TERMS_VERSION = "v1.0";
export const CURRENT_POLICY_VERSION = "v1.0";
export const TERMS_LAST_UPDATED = "19 October 2026";

export interface TermsPoint {
  id: number;
  title: string;
  text: string;
}

export const PIXELLO_TERMS_POINTS: TermsPoint[] = [
  {
    id: 1,
    title: "Order Details",
    text: "Customers must verify their product selection, quantity, uploaded photos, customization details, and delivery address before placing an order.",
  },
  {
    id: 2,
    title: "Personalized Products",
    text: "Minor colour, cropping, and printing variations may occur in customized products.",
  },
  {
    id: 3,
    title: "Order Confirmation",
    text: "Orders are confirmed after the required payment or order verification is completed.",
  },
  {
    id: 4,
    title: "Cancellation",
    text: "Cancellation or modification may not be possible once printing, customization, or production has started, subject to applicable law.",
  },
  {
    id: 5,
    title: "Refunds & Replacements",
    text: "Damaged, defective, incorrect, or eligible products will be reviewed under PixelloStore's refund and replacement policy and applicable consumer rights.",
  },
  {
    id: 6,
    title: "Photo Rights",
    text: "Customers must have permission to upload and use the photos submitted for printing or customization.",
  },
  {
    id: 7,
    title: "Privacy",
    text: "Customer details and uploaded photos will be used to process, prepare, and deliver orders in accordance with the Privacy Policy.",
  },
  {
    id: 8,
    title: "Printing & Packing",
    text: "PixelloStore's internal team currently handles order preparation, printing, quality checking, and packing.",
  },
  {
    id: 9,
    title: "Delivery",
    text: "Orders are handed over to the delivery partner when ready. Delivery dates are estimates, and tracking information is displayed when available.",
  },
  {
    id: 10,
    title: "Customer Agreement",
    text: "Customers confirm that they have read and agree to these Terms & Conditions and the applicable Privacy, Cancellation, Refund, and Shipping Policies.",
  },
];

export const TERMS_CHECKBOX_LABEL =
  "I have read and agree to the PixelloStore Terms & Conditions and applicable Privacy, Cancellation, Refund, and Shipping Policies.";
