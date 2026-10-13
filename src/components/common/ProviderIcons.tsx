interface IconProps {
  className?: string;
}

export function GoogleDriveIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5 9 8.7 15 8.7" />
      <path d="m9 8.7 4.5 7.8H21" />
      <path d="m15 8.7 4.5 7.8H6" />
      <polygon points="9 8.7 13.5 16.5 4.5 16.5" />
    </svg>
  );
}

export function OneDriveIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M7 15a4.5 4.5 0 0 1 5-4.4" />
    </svg>
  );
}
