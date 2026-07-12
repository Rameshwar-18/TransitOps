const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_project_url' || supabaseUrl === '') {
  console.warn('⚠️ Supabase credentials not configured or placeholder used. Falling back to Local In-Memory Mock Database!');
  
  // Simple In-memory mock database
  const usersStore = [];

  supabase = {
    from(table) {
      if (table !== 'users') {
        throw new Error(`Mock table ${table} not implemented`);
      }

      return {
        select(fields = '*') {
          return {
            eq(field, value) {
              return {
                async single() {
                  const found = usersStore.find(u => u[field] === value);
                  if (!found) {
                    return { data: null, error: { message: 'Row not found' } };
                  }
                  
                  let result = { ...found };
                  if (fields !== '*') {
                    const allowed = fields.split(',').map(f => f.trim());
                    const filtered = {};
                    allowed.forEach(f => {
                      filtered[f] = result[f];
                    });
                    result = filtered;
                  }
                  return { data: result, error: null };
                }
              };
            }
          };
        },

        insert(rows) {
          const row = rows[0];
          const newRecord = {
            id: crypto.randomBytes(16).toString('hex'),
            name: row.name,
            email: row.email,
            password_hash: row.password_hash,
            role: row.role || 'FleetManager',
            status: row.status || 'Active',
            created_at: new Date().toISOString()
          };
          usersStore.push(newRecord);

          return {
            select() {
              return {
                async single() {
                  return { data: newRecord, error: null };
                }
              };
            }
          };
        }
      };
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = supabase;
