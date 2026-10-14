/* Export Button — floating action button that triggers JSON data download.
   Matches the industrial design language: minimal icon, warm on-hover accent,
   accessible ARIA label, reduced-motion friendly. */

interface ExportButtonProps {
  exportData: () => void
}

export function ExportButton({ exportData }: ExportButtonProps) {
  return (
    <button
      className="fixed inset-y-0 right-2 flex items-center justify-center z-20 pointer-events-auto"
      aria-label="Export inspection data as JSON"
      onClick={exportData}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-tx-3 hover:text-visoft transition-colors"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}