'use client';

interface AddChartButtonProps {
  onClick: () => void;
}

export default function AddChartButton({ onClick }: AddChartButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors group"
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-sm text-gray-400 group-hover:text-gray-500 transition-colors">
          チャートを追加する
        </span>
      </div>
    </button>
  );
}
