import { pool } from '../config/database.js';

export class BaseModel {
    constructor(tableName) {
        this.table = tableName;
    }

    async findAll(conditions = {}, options = {}) {
        let query = `SELECT * FROM ${this.table}`;
        const values = [];
        
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            query += ` WHERE ${whereClause}`;
            values.push(...Object.values(conditions));
        }
        
        if (options.orderBy) {
            query += ` ORDER BY ${options.orderBy}`;
        }
        
        if (options.limit) {
            query += ` LIMIT ${options.limit}`;
            if (options.offset) {
                query += ` OFFSET ${options.offset}`;
            }
        }
        
        const [rows] = await pool.execute(query, values);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT * FROM ${this.table} WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        
        const [result] = await pool.execute(
            `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
        );
        
        return this.findById(result.insertId);
    }

    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        
        await pool.execute(
            `UPDATE ${this.table} SET ${setClause} WHERE id = ?`,
            [...values, id]
        );
        
        return this.findById(id);
    }

    async delete(id) {
        const [result] = await pool.execute(
            `DELETE FROM ${this.table} WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    async paginate(page = 1, limit = 10, conditions = {}) {
        const offset = (page - 1) * limit;
        const items = await this.findAll(conditions, { limit, offset });
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM ${this.table}`
        );
        
        return {
            items,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    async transaction(callback) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}