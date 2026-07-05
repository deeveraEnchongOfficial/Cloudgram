interface CloudgramLogoProps {
  className?: string;
}

export function CloudgramLogo({ className }: CloudgramLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M22 18.5C22 20.43 20.43 22 18.5 22H10.5C8.57 22 7 20.43 7 18.5C7 17.24 7.66 16.13 8.66 15.5C8.64 15.34 8.63 15.17 8.63 15C8.63 12.51 10.64 10.5 13.13 10.5C14.87 10.5 16.38 11.49 17.12 12.94C17.64 12.67 18.23 12.5 18.86 12.5C20.73 12.5 22.25 14.02 22.25 15.89C22.25 16.12 22.23 16.35 22.18 16.57C22.68 17.07 23 17.75 23 18.5H22Z"
        fill="white"
      />
      <path
        d="M14 18L16 16L18 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="15" y="16" width="2" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}
