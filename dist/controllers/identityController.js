"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Contact_1 = __importDefault(require("../models/Contact"));
class IdentityController {
    async identify(req, res) {
        try {
            const { email, phoneNumber } = req.body;
            // Validate input
            if (!email && !phoneNumber) {
                return res.status(400).json({ error: 'Email or phone number is required' });
            }
            // Find existing contacts including all linked ones
            const existingContacts = await Contact_1.default.findByEmailOrPhone(email, phoneNumber);
            if (existingContacts.length === 0) {
                // Create new primary contact
                const newContact = await Contact_1.default.create({
                    email,
                    phoneNumber,
                    linkedId: null,
                    linkPrecedence: 'primary'
                });
                // Return response with single contact
                return res.json({
                    contact: {
                        primaryContactId: newContact.id,
                        emails: email ? [email] : [],
                        phoneNumbers: phoneNumber ? [phoneNumber] : [],
                        secondaryContactIds: []
                    }
                });
            }
            // Sort contacts by creation date to find the oldest one
            const sortedContacts = [...existingContacts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const oldestContact = sortedContacts[0];
            const primaryContact = oldestContact;
            // Convert any other primary contacts to secondary and link them to the oldest contact
            const primaryContacts = sortedContacts.filter(c => c.linkPrecedence === 'primary' && c.id !== primaryContact.id);
            for (const contact of primaryContacts) {
                await Contact_1.default.update(contact.id, {
                    linkPrecedence: 'secondary',
                    linkedId: primaryContact.id
                });
            }
            // Check if we need to create a new secondary contact
            // Only create if the exact combination doesn't exist AND we're not just linking existing contacts
            const needsNewContact = email &&
                phoneNumber &&
                !existingContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber) &&
                !primaryContacts.length; // Don't create new contact if we're just linking existing ones
            if (needsNewContact) {
                await Contact_1.default.create({
                    email,
                    phoneNumber,
                    linkedId: primaryContact.id,
                    linkPrecedence: 'secondary'
                });
            }
            // Get all linked contacts including the new one if created
            const allLinkedContacts = await Contact_1.default.getAllLinkedContacts(primaryContact.id);
            // Prepare response
            const response = {
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: [...new Set(allLinkedContacts.map(c => c.email).filter(Boolean))],
                    phoneNumbers: [...new Set(allLinkedContacts.map(c => c.phoneNumber).filter(Boolean))],
                    secondaryContactIds: allLinkedContacts
                        .filter(c => c.linkPrecedence === 'secondary')
                        .map(c => c.id)
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error in identify:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.default = new IdentityController();