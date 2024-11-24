import pool from '../config/database';

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ContactResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

class ContactModel {
  // Find contacts by email or phone with recursive linking
  async findByEmailOrPhone(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
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
    
    const [rows] = await pool.query(query, [email, phoneNumber]);
    return rows as Contact[];
  }

  // Create new contact
  async create(contact: Partial<Contact>): Promise<Contact> {
    const query = `
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.query(query, [
      contact.phoneNumber,
      contact.email,
      contact.linkedId,
      contact.linkPrecedence
    ]);
    return { ...contact, id: (result as any).insertId } as Contact;
  }

  // Update contact
  async update(id: number, updates: Partial<Contact>): Promise<void> {
    const query = `
      UPDATE Contact 
      SET linkedId = ?, linkPrecedence = ?, updatedAt = NOW()
      WHERE id = ?
    `;
    await pool.query(query, [updates.linkedId, updates.linkPrecedence, id]);
  }

  // Get all linked contacts
  async getAllLinkedContacts(primaryId: number): Promise<Contact[]> {
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
    const [rows] = await pool.query(query, [primaryId]);
    return rows as Contact[];
  }
}

export default new ContactModel();