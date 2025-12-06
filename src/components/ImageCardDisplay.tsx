'use client';

import { ImageCardConfig } from '@/types';

interface ImageCardDisplayProps {
  config: ImageCardConfig;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ImageCardDisplay({ config, onEdit, onDelete }: ImageCardDisplayProps) {
  return (
    <div className="bg-white border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">
            {config.title}
          </h3>
          {config.description && (
            <p className="mt-1 text-sm text-gray-600">
              {config.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 画像 */}
      <div className="p-6">
        <div className="flex justify-center">
          <img
            src={config.imageData}
            alt={config.title}
            className="max-w-full max-h-96 object-contain"
          />
        </div>
        {config.caption && (
          <p className="mt-4 text-center text-sm text-gray-500">
            {config.caption}
          </p>
        )}
      </div>
    </div>
  );
}
