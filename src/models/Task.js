const { getPool } = require('../config/database');

class Task {
  static async findAll() {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(taskData) {
    const pool = getPool();
    const { title, description } = taskData;
    const [result] = await pool.execute(
      'INSERT INTO tasks (title, description) VALUES (?, ?)',
      [title, description]
    );
    return { id: result.insertId, ...taskData, completed: false };
  }

  static async update(id, taskData) {
    const pool = getPool();
    const { title, description, completed } = taskData;
    await pool.execute(
      'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?',
      [title, description, completed, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Task;
