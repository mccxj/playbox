import type { D1Storage } from '../interface';

export class VercelD1Adapter implements D1Storage {
  private tables = new Map<string, any[]>();

  async query(sql: string, params?: any[]): Promise<{ results: any[] }> {
    const parsed = this.parseSelect(sql);
    if (!parsed) return { results: [] };

    const { table, where } = parsed;
    let rows = this.tables.get(table) || [];

    if (where && params && params.length > 0) {
      rows = rows.filter((row) => this.evaluateWhere(row, where, params));
    }

    return { results: rows };
  }

  async execute(sql: string, params?: any[]): Promise<{ success: boolean }> {
    // Handle INSERT
    const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const [, table, cols, vals] = insertMatch;
      const columns = cols.split(',').map(c => c.trim());
      const placeholders = vals.split(',').map(v => v.trim());
      const row: any = {};
      columns.forEach((col, i) => {
        row[col] = placeholders[i] === '?' ? params![i] : placeholders[i].replace(/'/g, '');
      });
      const rows = this.tables.get(table) || [];
      rows.push(row);
      this.tables.set(table, rows);
      return { success: true };
    }

    // Handle UPDATE
    const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
    if (updateMatch) {
      const [, table, setClause, whereClause] = updateMatch;
      const rows = this.tables.get(table) || [];

      // Parse SET clause
      const setPairs = setClause.split(',').map(p => {
        const [col, val] = p.split('=').map(s => s.trim());
        return { col, val };
      });

      // Count ? in SET clause to determine param split
      const setQuestionCount = (setClause.match(/\?/g) || []).length;

      // Pre-parse SET values
      let setParamIndex = 0;
      const setValues: Record<string, any> = {};
      setPairs.forEach(({ col, val }) => {
        const cleanVal = val.replace(/'/g, '');
        if (cleanVal === '?') {
          setValues[col] = params![setParamIndex++];
        } else {
          setValues[col] = cleanVal;
        }
      });

      // Apply to matching rows
      rows.forEach(row => {
        if (this.evaluateWhere(row, whereClause, params?.slice(setQuestionCount) || [])) {
          Object.assign(row, setValues);
        }
      });

      return { success: true };
    }

    // Handle DELETE
    const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
    if (deleteMatch) {
      const [, table, whereClause] = deleteMatch;
      let rows = this.tables.get(table) || [];
      rows = rows.filter(row => !this.evaluateWhere(row, whereClause, params || []));
      this.tables.set(table, rows);
      return { success: true };
    }

    return { success: false };
  }

  private parseSelect(sql: string): { table: string; where?: string } | null {
    const match = sql.match(/SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
    if (!match) return null;
    return {
      table: match[1],
      where: match[2],
    };
  }

  private evaluateWhere(row: any, where: string, params: any[]): boolean {
    const conditions = where.split(/\s+AND\s+/i);
    let paramIdx = 0;

    return conditions.every((condition) => {
      const match = condition.match(/(\w+)\s*([><=]+)\s*(.+)/);
      if (!match) return true;
      const [, col, op, rawVal] = match;
      const val = rawVal.trim();
      const compareValue = val === '?' ? params[paramIdx++] : val.replace(/'/g, '');
      const rowValue = row[col];
      switch (op) {
        case '=':
          return rowValue === compareValue;
        case '>':
          return rowValue > compareValue;
        case '<':
          return rowValue < compareValue;
        default:
          return true;
      }
    });
  }
}
