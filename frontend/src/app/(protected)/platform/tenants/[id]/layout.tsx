import { ReactNode } from "react";

export default function TenantProfileLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* TenantHeader on child pages provides breadcrumbs and title */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {children}
      </main>
    </div>
  );
}
