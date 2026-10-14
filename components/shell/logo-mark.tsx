import { cn } from "@/lib/utils";

/** Mochi's face as a small line mark, for the logo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path d="M4.6 10.4 L4.2 3.6 L9 7.1" />
      <path d="M19.4 10.4 L19.8 3.6 L15 7.1" />
      <path d="M12 6.6 C 17.2 6.6 20.6 9.8 20.6 13.9 C 20.6 18.2 16.8 20.6 12 20.6 C 7.2 20.6 3.4 18.2 3.4 13.9 C 3.4 9.8 6.8 6.6 12 6.6 Z" />
      <path d="M7.6 13.4 Q 8.6 12.3 9.6 13.4" />
      <path d="M14.4 13.4 Q 15.4 12.3 16.4 13.4" />
      <path d="M10.8 16.2 Q 11.4 16.9 12 16.3 Q 12.6 16.9 13.2 16.2" />
    </svg>
  );
}
