import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start with RANA AI — ₹2,500 Trial Pack",
  description: "Create your RANA AI workspace and start with the ₹2,500 trial pack: our team sets up an AI calling agent on your script, in Telugu, Hindi, Tamil and more.",
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
