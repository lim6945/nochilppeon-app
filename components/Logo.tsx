export default function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const isSmall = size === "sm";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center justify-center rounded-full bg-amber-100 ${
          isSmall ? "h-7 w-7 text-base" : "h-9 w-9 text-lg"
        }`}
      >
        😉
      </span>
      <span className={`font-extrabold text-gray-900 ${isSmall ? "text-lg" : "text-xl"}`}>
        놓칠뻔
      </span>
    </div>
  );
}
