export default function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdfbf6]">
      <div className="flex flex-col items-center gap-3">
        <div
          role="status"
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-4 border-[#4A0E17]/15 border-t-[#4A0E17]"
        />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4A0E17]/60">
          Loading
        </p>
      </div>
    </div>
  );
}
