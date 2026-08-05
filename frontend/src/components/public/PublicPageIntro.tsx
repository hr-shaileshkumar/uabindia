"use client";

import PublicSectionHeading from "@/components/public/PublicSectionHeading";

type PublicPageIntroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
  singleLine?: boolean;
};

export default function PublicPageIntro(props: PublicPageIntroProps) {
  return <PublicSectionHeading {...props} />;
}
