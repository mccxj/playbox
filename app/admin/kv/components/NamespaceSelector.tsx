'use client';

import { Select } from 'antd';
import type { KVNamespaceOption } from '../../types/kv';

interface NamespaceSelectorProps {
  namespaces: KVNamespaceOption[];
  selected: string;
  onChange: (namespace: string) => void;
  loading?: boolean;
}

export default function NamespaceSelector({ namespaces, selected, onChange, loading = false }: NamespaceSelectorProps) {
  return (
    <div style={{ minWidth: 300 }}>
      <Select
        value={selected}
        onChange={onChange}
        style={{ width: '100%' }}
        placeholder="Select namespace"
        loading={loading}
        optionLabelProp="label"
        disabled={loading || namespaces.length === 0}
        options={namespaces.map((ns) => ({
          label: `${ns.label} (${ns.id})`,
          value: ns.value,
          id: ns.id,
        }))}
      />
    </div>
  );
}
