'use client';

import { useState, useEffect } from 'react';
import ChartCreatorInline from './ChartCreatorInline';
import ChartDisplayInline from './ChartDisplayInline';
import { ChartConfig } from '@/types';

interface ChartCardProps {
  id: string;
  initialConfig?: ChartConfig | null;
  onDelete: (id: string) => void;
  onConfigChange?: (id: string, config: ChartConfig) => void;
}

export default function ChartCard({ id, initialConfig, onDelete, onConfigChange }: ChartCardProps) {
  const [isEditing, setIsEditing] = useState(!initialConfig);
  const [config, setConfig] = useState<ChartConfig | null>(initialConfig || null);

  // initialConfigが変更されたら反映（インポート時用）
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setIsEditing(false);
    }
  }, [initialConfig]);

  const handleCreate = (newConfig: ChartConfig) => {
    setConfig(newConfig);
    setIsEditing(false);
    // 親に設定変更を通知
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

  if (isEditing) {
    return (
      <ChartCreatorInline
        initialConfig={config}
        onSubmit={handleCreate}
        onCancel={config ? handleCancel : undefined}
        onDelete={() => onDelete(id)}
        isNew={!config}
      />
    );
  }

  return (
    <ChartDisplayInline
      config={config!}
      onEdit={handleEdit}
      onDelete={() => onDelete(id)}
    />
  );
}
