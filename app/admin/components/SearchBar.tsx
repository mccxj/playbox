'use client';

import { useState, useEffect } from 'react';
import { Space, Select, Input, Button } from 'antd';
import { SearchOutlined, ClearOutlined, PlusOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnInfo } from '../types';
import { useIsMobile } from '../../lib/responsive';

interface SearchBarProps {
  columns: ColumnInfo[];
  onSearch: (value: string, column: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onRefresh: () => void;
}

export default function SearchBar({ columns, onSearch, onCreate, onImport, onRefresh }: SearchBarProps) {
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [searchColumn, setSearchColumn] = useState('');

  useEffect(() => {
    if (columns.length > 0 && !searchColumn) {
      setSearchColumn(columns[0].name);
    }
  }, [columns, searchColumn]);

  const handleSearch = () => {
    if (searchColumn) {
      onSearch(searchValue, searchColumn);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('', '');
  };

  return (
    <div style={{ marginBottom: 16, display: 'flex', gap: isMobile ? 8 : 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <Space.Compact style={{ width: '100%', maxWidth: 400, flex: isMobile ? '1 1 100%' : '0 0 auto' }}>
        <Select
          style={{ width: isMobile ? '35%' : 150 }}
          value={searchColumn}
          onChange={setSearchColumn}
          options={columns.map((c) => ({ label: c.name, value: c.name }))}
          placeholder="Column"
        />
        <Input
          style={{ width: isMobile ? '35%' : 200 }}
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          {!isMobile && 'Search'}
        </Button>
        <Button icon={<ClearOutlined />} onClick={handleClear}>
          {!isMobile && 'Clear'}
        </Button>
      </Space.Compact>

      <div style={{ flex: 1 }} />

      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          {!isMobile && 'Refresh'}
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {!isMobile ? 'New Row' : 'New'}
        </Button>
        <Button icon={<UploadOutlined />} onClick={onImport}>
          {!isMobile && 'Import'}
        </Button>
      </Space>
    </div>
  );
}
