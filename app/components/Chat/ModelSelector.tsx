'use client';

import { useMemo } from 'react';
import { Select } from 'antd';
import { Model } from '../../lib/chat-api';

interface Props {
  models: Model[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export default function ModelSelector({ models, value, onChange, loading }: Props) {
  // Deduplicate models by id
  const uniqueModels = useMemo(() => {
    const seen = new Set<string>();
    return models.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [models]);

  return (
    <Select
      showSearch
      placeholder="Select model"
      value={value}
      onChange={onChange}
      loading={loading}
      style={{ width: 200 }}
      options={uniqueModels.map((m) => ({ label: m.id, value: m.id }))}
      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
    />
  );
}
