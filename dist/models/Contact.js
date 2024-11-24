"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class ContactModel {
    // Find contacts by email or phone with recursive linking
    async findByEmailOrPhone(email, phoneNumber) {
        const query = `
      WITH RECURSIVE LinkedContacts AS (
        -- Base case: Find direct matches
        SELECT * FROM Contact 
        WHERE (email = ? OR phoneNumber = ?) 
        AND deletedAt IS NULL

        UNION

        -- Recursive case: Find linked contacts
        SELECT c.* 
        FROM Contact c
        INNER JOIN LinkedContacts lc ON 
          (c.id = lc.linkedId) OR 
          (c.linkedId = lc.id) OR
          (c.linkedId = lc.linkedId AND c.linkedId IS NOT NULL)
        WHERE c.deletedAt IS NULL
      )
      SELECT DISTINCT * FROM LinkedContacts
      ORDER BY createdAt ASC;
    `;
        const [rows] = await database_1.default.query(query, [email, phoneNumber]);
        return rows;
    }
    // Create new contact
    async create(contact) {
        const query = `
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
        const [result] = await database_1.default.query(query, [
            contact.phoneNumber,
            contact.email,
            contact.linkedId,
            contact.linkPrecedence
        ]);
        return { ...contact, id: result.insertId };
    }
    // Update contact
    async update(id, updates) {
        const query = `
      UPDATE Contact 
      SET linkedId = ?, linkPrecedence = ?, updatedAt = NOW()
      WHERE id = ?
    `;
        await database_1.default.query(query, [updates.linkedId, updates.linkPrecedence, id]);
    }
    // Get all linked contacts
    async getAllLinkedContacts(primaryId) {
        const query = `
      WITH RECURSIVE LinkedContacts AS (
        -- Base case: Start with the primary contact
        SELECT * FROM Contact WHERE id = ? AND deletedAt IS NULL
        
        UNION ALL
        
        -- Recursive case: Get all secondary contacts
        SELECT c.* 
        FROM Contact c
        INNER JOIN LinkedContacts lc ON c.linkedId = lc.id
        WHERE c.deletedAt IS NULL
      )
      SELECT DISTINCT * FROM LinkedContacts
      ORDER BY createdAt ASC;
    `;
        const [rows] = await database_1.default.query(query, [primaryId]);
        return rows;
    }
}
exports.default = new ContactModel();
