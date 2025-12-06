'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { BulletCardConfig, BulletItem } from '@/types';

interface BulletCardProps {
  config: BulletCardConfig | null;
  title: string;
  description: string;
  onSubmit: (config: BulletCardConfig) => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function BulletCard({ config, title, description, onSubmit, onDelete, onBack }: BulletCardProps) {
  const [items, setItems] = useState<BulletItem[]>(
    config?.items || [{ id: '1', text: '', indent: 0 }]
  );
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const focusTargetRef = useRef<string | null>(null);

  // refのコールバック
  const setInputRef = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current.set(id, el);
      // フォーカス対象の場合はフォーカス
      if (focusTargetRef.current === id) {
        el.focus();
        focusTargetRef.current = null;
      }
    } else {
      inputRefs.current.delete(id);
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    const item = items[index];

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // 現在のカーソル位置を取得
      const input = e.currentTarget;
      const cursorPos = input.selectionStart || 0;
      const currentText = item.text;

      // カーソル位置で文字列を分割
      const textBefore = currentText.substring(0, cursorPos);
      const textAfter = currentText.substring(cursorPos);

      // 新しいアイテムを追加
      const newId = String(Date.now());
      const newItem: BulletItem = {
        id: newId,
        text: textAfter, // カーソル以降のテキストを新しい行に
        indent: item.indent
      };
      const newItems = [...items];
      // 現在のアイテムのテキストをカーソル前までに更新
      newItems[index] = { ...item, text: textBefore };
      newItems.splice(index + 1, 0, newItem);
      focusTargetRef.current = newId;
      setItems(newItems);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // インデント減少
        if (item.indent > 0) {
          setItems(items.map((it, i) =>
            i === index ? { ...it, indent: it.indent - 1 } : it
          ));
        }
      } else {
        // インデント増加（最大3レベル）
        if (item.indent < 3) {
          setItems(items.map((it, i) =>
            i === index ? { ...it, indent: it.indent + 1 } : it
          ));
        }
      }
    } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
      e.preventDefault();
      // 空のアイテムを削除
      const prevItem = items[index - 1];
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      // 前のアイテムにフォーカス
      if (prevItem) {
        focusTargetRef.current = prevItem.id;
        setTimeout(() => {
          const input = inputRefs.current.get(prevItem.id);
          if (input) {
            input.focus();
            // カーソルを末尾に移動
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }, 0);
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevItem = items[index - 1];
      const input = inputRefs.current.get(prevItem.id);
      if (input) {
        input.focus();
      }
    } else if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      const nextItem = items[index + 1];
      const input = inputRefs.current.get(nextItem.id);
      if (input) {
        input.focus();
      }
    }
  };

  const handleTextChange = (id: string, text: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  };

  const handleSubmit = () => {
    // 空のアイテムを除外
    const validItems = items.filter(item => item.text.trim() !== '');
    if (validItems.length === 0) {
      alert('少なくとも1つの項目を入力してください');
      return;
    }

    onSubmit({
      cardType: 'bullet',
      title,
      description,
      items: validItems
    });
  };

  const getIndentStyle = (indent: number) => {
    return { paddingLeft: `${indent * 24}px` };
  };

  const getBulletChar = (indent: number) => {
    const bullets = ['•', '◦', '▪', '▫'];
    return bullets[indent] || '•';
  };

  return (
    <div className="space-y-4">
      {/* 箇条書き入力エリア */}
      <div className="border border-gray-200 bg-white">
        <div className="p-4 space-y-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2"
              style={getIndentStyle(item.indent)}
            >
              <span className="text-gray-400 w-4 text-center select-none">
                {getBulletChar(item.indent)}
              </span>
              <input
                ref={(el) => setInputRef(item.id, el)}
                type="text"
                value={item.text}
                onChange={(e) => handleTextChange(item.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                placeholder={index === 0 ? '項目を入力（Enterで追加、Tabでインデント）' : ''}
                className="flex-1 py-1 px-2 text-sm text-gray-700 border-0 focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Enter: 新しい項目 | Tab: インデント増 | Shift+Tab: インデント減 | ↑↓: 移動
          </p>
        </div>
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
          disabled={!title.trim()}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            title.trim()
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
