export function PublicPageLoading({ label = "Loading company content..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="rounded-[1.5rem] border border-[#d9e1e7] bg-white/90 px-6 py-5 text-sm font-medium text-[#536574] shadow-sm">
        {label}
      </div>
    </div>
  );
}
