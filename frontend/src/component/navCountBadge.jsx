export default function NavCountBadge({ count }) {
  const value = Number(count || 0);

  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[10px] font-black leading-none text-[#D4AF37]"
      aria-label={`${value} active`}
    >
      {value}
    </span>
  );
}
