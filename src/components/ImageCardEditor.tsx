'use client';

import { useState, useRef } from 'react';
import { ImageCardConfig } from '@/types';

interface ImageCardEditorProps {
  config: ImageCardConfig | null;
  title: string;
  description: string;
  onSubmit: (config: ImageCardConfig) => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function ImageCardEditor({ config, title, description, onSubmit, onDelete, onBack }: ImageCardEditorProps) {
  const [imageData, setImageData] = useState(config?.imageData || '');
  const [caption, setCaption] = useState(config?.caption || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = () => {
    if (!title.trim() || !imageData) {
      alert('タイトルと画像は必須です');
      return;
    }
    onSubmit({
      cardType: 'image',
      title,
      description,
      imageData,
      caption: caption.trim() || undefined
    });
  };

  const clearImage = () => {
    setImageData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 画像アップロードエリア */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {imageData ? (
          <div className="relative border border-gray-200">
            <img
              src={imageData}
              alt="プレビュー"
              className="max-w-full max-h-64 object-contain mx-auto"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-gray-50"
              title="画像を削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed cursor-pointer transition-colors ${
              isDragging
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              クリックまたはドラッグ&ドロップで画像をアップロード
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF（最大10MB）
            </p>
          </div>
        )}
      </div>

      {/* キャプション */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">キャプション（任意）</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="画像の説明"
          className="w-full px-3 py-2 border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !imageData}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            title.trim() && imageData
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {config ? '変更を保存' : 'カードを作成'}
        </button>
      </div>
    </div>
  );
}
