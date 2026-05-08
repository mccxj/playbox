import { describe, it, expect, beforeEach } from 'vitest';
import { VercelD1Adapter } from '../../../../src/storage/vercel/d1';

describe('VercelD1Adapter', () => {
  let adapter: VercelD1Adapter;

  beforeEach(() => {
    adapter = new VercelD1Adapter();
  });

  describe('query', () => {
    it('should return empty results for non-existent table', async () => {
      const result = await adapter.query('SELECT * FROM users');
      expect(result).toEqual({ results: [] });
    });

    it('should return all rows from table without WHERE clause', async () => {
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [1, 'Alice']);
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [2, 'Bob']);

      const result = await adapter.query('SELECT * FROM users');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.results[1]).toEqual({ id: 2, name: 'Bob' });
    });

    it('should filter results with WHERE clause and params', async () => {
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [1, 'Alice']);
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [2, 'Bob']);

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ id: 1, name: 'Alice' });
    });

    it('should handle WHERE clause with multiple conditions', async () => {
      await adapter.execute('INSERT INTO users (id, name, age) VALUES (?, ?, ?)', [1, 'Alice', 30]);
      await adapter.execute('INSERT INTO users (id, name, age) VALUES (?, ?, ?)', [2, 'Bob', 25]);

      const result = await adapter.query('SELECT * FROM users WHERE age > ? AND name = ?', [25, 'Alice']);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ id: 1, name: 'Alice', age: 30 });
    });
  });

  describe('execute', () => {
    it('should insert rows and return success', async () => {
      const result = await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [1, 'Alice']);
      expect(result).toEqual({ success: true });

      const queryResult = await adapter.query('SELECT * FROM users');
      expect(queryResult.results).toHaveLength(1);
    });

    it('should update rows and return success', async () => {
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [1, 'Alice']);

      const result = await adapter.execute('UPDATE users SET name = ? WHERE id = ?', ['Bob', 1]);
      expect(result).toEqual({ success: true });

      const queryResult = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);
      expect(queryResult.results[0].name).toBe('Bob');
    });

    it('should delete rows and return success', async () => {
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [1, 'Alice']);
      await adapter.execute('INSERT INTO users (id, name) VALUES (?, ?)', [2, 'Bob']);

      const result = await adapter.execute('DELETE FROM users WHERE id = ?', [1]);
      expect(result).toEqual({ success: true });

      const queryResult = await adapter.query('SELECT * FROM users');
      expect(queryResult.results).toHaveLength(1);
      expect(queryResult.results[0].id).toBe(2);
    });

    it('should handle INSERT with multiple columns', async () => {
      const result = await adapter.execute('INSERT INTO posts (id, title, content) VALUES (?, ?, ?)', [1, 'Test', 'Content']);
      expect(result).toEqual({ success: true });

      const queryResult = await adapter.query('SELECT * FROM posts');
      expect(queryResult.results[0]).toEqual({ id: 1, title: 'Test', content: 'Content' });
    });
  });
});
