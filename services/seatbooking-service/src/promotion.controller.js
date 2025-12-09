import { db } from "./database.js";

// ==================== GET ALL PROMOTIONS ====================
export const getPromotions = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 2/0, 
            search = '', 
            is_active 
        } = req.query;

        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(title ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (is_active !== undefined) {
            whereConditions.push(`is_active = $${paramIndex}`);
            params.push(is_active === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM promotions ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get promotions
        const query = `
            SELECT * FROM promotions 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const result = await db.query(query, [...params, limit, offset]);

        res.json({
            promotions: result.rows,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error getting promotions:', error);
        res.status(500).json({ error: 'Failed to get promotions' });
    }
};

// ==================== GET PROMOTION BY ID ====================
export const getPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'SELECT * FROM promotions WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting promotion:', error);
        res.status(500).json({ error: 'Failed to get promotion' });
    }
};

// ==================== CREATE PROMOTION ====================
export const createPromotion = async (req, res) => {
    try {
        const {
            title,
            description,
            code,
            discount_type,
            discount_value,
            min_purchase,
            max_discount,
            usage_limit,
            start_date,
            end_date,
            banner_url,
            is_active = true,
            applicable_to = 'ALL',
            applicable_items = [],
            min_tickets = 1
        } = req.body;

        // Validate required fields
        if (!title || !code || !discount_type || discount_value === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate discount type
        if (!['PERCENTAGE', 'FIXED'].includes(discount_type)) {
            return res.status(400).json({ error: 'Invalid discount_type. Must be PERCENTAGE or FIXED' });
        }

        // Check if code already exists
        const checkCode = await db.query('SELECT id FROM promotions WHERE code = $1', [code]);
        if (checkCode.rows.length > 0) {
            return res.status(400).json({ error: 'Promotion code already exists' });
        }

        const query = `
            INSERT INTO promotions (
                title, description, code, discount_type, discount_value,
                min_purchase, max_discount, usage_limit, start_date, end_date,
                banner_url, is_active, applicable_to, applicable_items, min_tickets,
                used_count, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, NOW(), NOW())
            RETURNING *
        `;

        const result = await db.query(query, [
            title,
            description,
            code,
            discount_type,
            discount_value,
            min_purchase || null,
            max_discount || null,
            usage_limit || null,
            start_date || null,
            end_date || null,
            banner_url || null,
            is_active,
            applicable_to,
            JSON.stringify(applicable_items),
            min_tickets
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ error: 'Failed to create promotion' });
    }
};

// ==================== UPDATE PROMOTION ====================
export const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            code,
            discount_type,
            discount_value,
            min_purchase,
            max_discount,
            usage_limit,
            start_date,
            end_date,
            banner_url,
            is_active,
            applicable_to,
            applicable_items,
            min_tickets
        } = req.body;

        // Check if promotion exists
        const checkPromotion = await db.query('SELECT id FROM promotions WHERE id = $1', [id]);
        if (checkPromotion.rows.length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Check if code already exists for another promotion
        if (code) {
            const checkCode = await db.query('SELECT id FROM promotions WHERE code = $1 AND id != $2', [code, id]);
            if (checkCode.rows.length > 0) {
                return res.status(400).json({ error: 'Promotion code already exists' });
            }
        }

        const query = `
            UPDATE promotions SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                code = COALESCE($3, code),
                discount_type = COALESCE($4, discount_type),
                discount_value = COALESCE($5, discount_value),
                min_purchase = COALESCE($6, min_purchase),
                max_discount = COALESCE($7, max_discount),
                usage_limit = COALESCE($8, usage_limit),
                start_date = COALESCE($9, start_date),
                end_date = COALESCE($10, end_date),
                banner_url = COALESCE($11, banner_url),
                is_active = COALESCE($12, is_active),
                applicable_to = COALESCE($13, applicable_to),
                applicable_items = COALESCE($14, applicable_items),
                min_tickets = COALESCE($15, min_tickets),
                updated_at = NOW()
            WHERE id = $16
            RETURNING *
        `;

        const result = await db.query(query, [
            title,
            description,
            code,
            discount_type,
            discount_value,
            min_purchase,
            max_discount,
            usage_limit,
            start_date,
            end_date,
            banner_url,
            is_active,
            applicable_to,
            applicable_items ? JSON.stringify(applicable_items) : null,
            min_tickets,
            id
        ]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Failed to update promotion' });
    }
};

// ==================== DELETE PROMOTION ====================
export const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM promotions WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        res.json({ message: 'Promotion deleted successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Failed to delete promotion' });
    }
};

// ==================== VALIDATE PROMOTION CODE ====================
export const validatePromotionCode = async (req, res) => {
    try {
        const { code, total_amount } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Promotion code is required' });
        }

        const query = `
            SELECT * FROM promotions 
            WHERE code = $1 AND is_active = true
        `;
        
        const result = await db.query(query, [code]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or inactive promotion code' });
        }

        const promotion = result.rows[0];
        const now = new Date();

        // Check dates
        if (promotion.start_date && new Date(promotion.start_date) > now) {
            return res.status(400).json({ error: 'Promotion has not started yet' });
        }

        if (promotion.end_date && new Date(promotion.end_date) < now) {
            return res.status(400).json({ error: 'Promotion has expired' });
        }

        // Check usage limit
        if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
            return res.status(400).json({ error: 'Promotion usage limit reached' });
        }

        // Check minimum purchase
        if (promotion.min_purchase && total_amount < promotion.min_purchase) {
            return res.status(400).json({ 
                error: `Minimum purchase amount is ${promotion.min_purchase}` 
            });
        }

        // Calculate discount
        let discount_amount = 0;
        if (promotion.discount_type === 'PERCENTAGE') {
            discount_amount = (total_amount * promotion.discount_value) / 100;
            if (promotion.max_discount) {
                discount_amount = Math.min(discount_amount, promotion.max_discount);
            }
        } else {
            discount_amount = promotion.discount_value;
        }

        discount_amount = Math.min(discount_amount, total_amount);

        res.json({
            valid: true,
            promotion: {
                id: promotion.id,
                title: promotion.title,
                code: promotion.code,
                discount_type: promotion.discount_type,
                discount_value: promotion.discount_value
            },
            discount_amount,
            final_amount: total_amount - discount_amount
        });
    } catch (error) {
        console.error('Error validating promotion:', error);
        res.status(500).json({ error: 'Failed to validate promotion' });
    }
};

// ==================== GET ACTIVE PROMOTIONS (PUBLIC) ====================
export const getActivePromotions = async (req, res) => {
    try {
        const query = `
            SELECT * FROM promotions 
            WHERE is_active = true 
                AND (start_date IS NULL OR start_date <= NOW())
                AND (end_date IS NULL OR end_date >= NOW())
                AND (usage_limit IS NULL OR used_count < usage_limit)
            ORDER BY created_at DESC
        `;
        
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting active promotions:', error);
        res.status(500).json({ error: 'Failed to get active promotions' });
    }
};
