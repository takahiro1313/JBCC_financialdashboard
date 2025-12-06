'use client';

import { useState, useEffect } from 'react';
import CardEditor from './CardEditor';
import ChartDisplayInline from './ChartDisplayInline';
import BulletCardDisplay from './BulletCardDisplay';
import ImageCardDisplay from './ImageCardDisplay';
import { CardConfig, ChartConfig, BulletCardConfig, ImageCardConfig } from '@/types';

interface UnifiedCardProps {
  id: string;
  initialConfig?: CardConfig | null;
  onDelete: (id: string) => void;
  onConfigChange?: (id: string, config: CardConfig) => void;
}

export default function UnifiedCard({ id, initialConfig, onDelete, onConfigChange }: UnifiedCardProps) {
  const [isEditing, setIsEditing] = useState(!initialConfig);
  const [config, setConfig] = useState<CardConfig | null>(initialConfig || null);

  // initialConfigが変更されたら反映（インポート時用）
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setIsEditing(false);
    }
  }, [initialConfig]);

  const handleCreate = (newConfig: CardConfig) => {
    setConfig(newConfig);
    setIsEditing(false);
    onConfigChange?.(id, newConfig);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (config) {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(id);
  };

  // 編集モード
  if (isEditing) {
    return (
      <CardEditor
        initialConfig={config}
        onSubmit={handleCreate}
        onCancel={config ? handleCancel : undefined}
        onDelete={handleDelete}
        isNew={!config}
      />
    );
  }

  // 表示モード
  if (!config) return null;

  switch (config.cardType) {
    case 'chart':
      return (
        <ChartDisplayInline
          config={config as ChartConfig}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    case 'bullet':
      return (
        <BulletCardDisplay
          config={config as BulletCardConfig}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    case 'image':
      return (
        <ImageCardDisplay
          config={config as ImageCardConfig}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );
    default:
      return null;
  }
}
