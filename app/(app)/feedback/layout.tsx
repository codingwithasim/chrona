import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title: "Contact",

  description:
    "Contact Chrona: report a bug, share an idea, or just say hello.",

  alternates: {
    canonical: "/feedback",
  },

  robots: {
    index: false,
    follow: true,
  },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}