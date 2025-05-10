import * as IMAP from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { storage } from './storage';
import { EmailSettings, InsertEmail, Email, InsertEmailResponse } from '@shared/schema';
import { openai } from './openai';

// For encrypting/decrypting sensitive credentials
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-for-development-only';
const IV_LENGTH = 16;

/**
 * Encrypt sensitive information before storing
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt stored credentials
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Connect to the user's email account via IMAP
 */
async function createImapConnection(emailSettings: EmailSettings): Promise<IMAP> {
  const credentials = JSON.parse(decrypt(emailSettings.credentials));
  
  const imapConfig = {
    user: credentials.username || emailSettings.email,
    password: credentials.password,
    host: credentials.host,
    port: credentials.port,
    tls: credentials.tls || true,
    tlsOptions: { rejectUnauthorized: false }
  };
  
  return new Promise((resolve, reject) => {
    const imap = new IMAP(imapConfig);
    
    imap.once('ready', () => {
      resolve(imap);
    });
    
    imap.once('error', (err: Error) => {
      reject(err);
    });
    
    imap.connect();
  });
}

/**
 * Fetch new emails and store them in the database
 */
export async function syncEmails(userId: number): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const emailSettings = await storage.getEmailSettings(userId);
    if (!emailSettings) {
      return { success: false, count: 0, error: 'Email settings not found' };
    }
    
    if (!emailSettings.active) {
      return { success: false, count: 0, error: 'Email integration is not active' };
    }
    
    const imap = await createImapConnection(emailSettings);
    const inbox = await openMailbox(imap, 'INBOX');
    
    // Get emails from the last 3 days or since last sync
    const lastSyncDate = emailSettings.lastSynced || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const fetchedEmails = await fetchEmails(imap, inbox, lastSyncDate);
    
    let newEmailCount = 0;
    
    // Process and store new emails
    for (const email of fetchedEmails) {
      const existing = await storage.getEmailByMessageId(email.messageId);
      if (!existing) {
        const insertEmail: InsertEmail = {
          userId,
          messageId: email.messageId,
          from: email.from,
          to: email.to,
          cc: email.cc || '',
          subject: email.subject || '',
          body: email.text,
          html: email.html || '',
          date: email.date,
          isRead: email.isRead || false,
          needsResponse: await determineIfNeedsResponse(email.text, email.subject || ''),
          responseGenerated: false,
          folderPath: email.folder || 'INBOX'
        };
        
        const savedEmail = await storage.createEmail(insertEmail);
        
        // If the email needs a response, generate one
        if (savedEmail.needsResponse) {
          await generateEmailResponse(userId, savedEmail.id);
        }
        
        newEmailCount++;
      }
    }
    
    // Update last sync time
    await storage.updateEmailSettings(userId, {
      lastSynced: new Date()
    });
    
    imap.end();
    
    return {
      success: true,
      count: newEmailCount
    };
  } catch (error) {
    console.error('Error syncing emails:', error);
    return {
      success: false,
      count: 0,
      error: error.message
    };
  }
}

/**
 * Open a mailbox (folder) in the IMAP connection
 */
function openMailbox(imap: IMAP, mailboxName: string): Promise<IMAP.Box> {
  return new Promise((resolve, reject) => {
    imap.openBox(mailboxName, false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

interface EmailData {
  messageId: string;
  from: string;
  to: string;
  cc?: string;
  subject?: string;
  text: string;
  html?: string;
  date: Date;
  isRead?: boolean;
  folder?: string;
}

/**
 * Fetch emails from the IMAP server since a specific date
 */
function fetchEmails(imap: IMAP, box: IMAP.Box, since: Date): Promise<EmailData[]> {
  return new Promise((resolve, reject) => {
    // Search for all emails since the given date
    const searchCriteria = ['UNSEEN', ['SINCE', since]];
    
    imap.search(searchCriteria, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (results.length === 0) {
        resolve([]);
        return;
      }
      
      const emails: EmailData[] = [];
      const fetch = imap.fetch(results, { bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)', 'TEXT'], struct: true });
      
      fetch.on('message', (msg) => {
        const email: Partial<EmailData> = {
          isRead: false,
          folder: box.name
        };
        
        msg.on('body', (stream, info) => {
          if (info.which.startsWith('HEADER')) {
            simpleParser(stream, {}, (err, parsed) => {
              if (err) return;
              
              email.messageId = parsed.messageId || `${Date.now()}-${Math.random()}`;
              email.from = parsed.from?.text || '';
              email.to = parsed.to?.text || '';
              email.cc = parsed.cc?.text || '';
              email.subject = parsed.subject || '';
              email.date = parsed.date || new Date();
            });
          } else {
            simpleParser(stream, {}, (err, parsed) => {
              if (err) return;
              
              email.text = parsed.text || '';
              email.html = parsed.html || '';
            });
          }
        });
        
        msg.once('end', () => {
          if (email.messageId && email.from && email.to && email.text) {
            emails.push(email as EmailData);
          }
        });
      });
      
      fetch.once('error', (err) => {
        reject(err);
      });
      
      fetch.once('end', () => {
        resolve(emails);
      });
    });
  });
}

/**
 * Use OpenAI to determine if an email needs a response
 */
async function determineIfNeedsResponse(emailBody: string, subject: string): Promise<boolean> {
  try {
    // Truncate long emails to a reasonable size for the AI
    const truncatedEmail = emailBody.length > 5000 
      ? `${emailBody.substring(0, 5000)}... [Email truncated]`
      : emailBody;
    
    const prompt = `
    Subject: ${subject}
    
    Email body:
    ${truncatedEmail}
    
    Based on the email above, does this email require a response? Consider:
    1. Is it a question or request directed at the recipient?
    2. Is it expecting some action or follow-up?
    3. Is it a personal message (not a newsletter, notification, or marketing)?
    4. Does it contain language suggesting a reply is expected?
    
    Respond with JSON:
    {"needsResponse": true|false, "confidence": 0.0-1.0}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that analyzes emails to determine if they require a response. Respond with JSON in the format: {\"needsResponse\": boolean, \"confidence\": number}"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Only consider it needs a response if confidence is high
    return result.needsResponse && result.confidence > 0.7;
  } catch (error) {
    console.error('Error determining if email needs response:', error);
    // Default to false if there's an error
    return false;
  }
}

/**
 * Generate a response to an email using OpenAI
 */
export async function generateEmailResponse(userId: number, emailId: number): Promise<boolean> {
  try {
    const email = await storage.getEmail(emailId);
    if (!email) {
      throw new Error('Email not found');
    }
    
    // Get user contexts to provide relevant information to the AI
    const userContexts = await storage.getContexts(userId);
    const activeContexts = userContexts.filter(ctx => ctx.active);
    
    let contextString = '';
    if (activeContexts.length > 0) {
      contextString = 'Using the following context information:\n\n';
      activeContexts.forEach(ctx => {
        // Truncate long contexts
        const truncatedContent = ctx.content.length > 1000 
          ? ctx.content.substring(0, 1000) + '... [Content truncated]' 
          : ctx.content;
        
        contextString += `--- ${ctx.name} ---\n${truncatedContent}\n\n`;
      });
    }
    
    const prompt = `
    ${contextString}
    
    You need to write a response to the following email:
    
    From: ${email.from}
    To: ${email.to}
    Subject: ${email.subject || '(No subject)'}
    
    ${email.body}
    
    Draft a professional and thoughtful response. Consider the tone, context, and any specific requests or questions in the email.
    
    Also, suggest up to 3 possible actions that might be appropriate based on this email (e.g., scheduling a meeting, sending additional information, etc.).
    
    Respond with JSON in this format:
    {
      "draftResponse": "Your draft email text here",
      "suggestedActions": [
        {"action": "Action description", "priority": "high|medium|low"}
      ]
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that drafts email responses based on the content of received emails and contextual information. Respond with JSON in the format specified."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Store the response in the database
    const insertResponse: InsertEmailResponse = {
      emailId: email.id,
      userId,
      draftResponse: result.draftResponse,
      suggestedActions: result.suggestedActions,
      status: 'draft'
    };
    
    await storage.createEmailResponse(insertResponse);
    
    // Update the email to mark response as generated
    await storage.updateEmail(emailId, {
      responseGenerated: true
    });
    
    return true;
  } catch (error) {
    console.error('Error generating email response:', error);
    return false;
  }
}

/**
 * Send an email using Nodemailer
 */
export async function sendEmail(userId: number, responseId: number, editedResponse?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const emailResponse = await storage.getEmailResponse(responseId);
    if (!emailResponse) {
      return { success: false, error: 'Email response not found' };
    }
    
    const email = await storage.getEmail(emailResponse.emailId);
    if (!email) {
      return { success: false, error: 'Original email not found' };
    }
    
    const emailSettings = await storage.getEmailSettings(userId);
    if (!emailSettings) {
      return { success: false, error: 'Email settings not found' };
    }
    
    const credentials = JSON.parse(decrypt(emailSettings.credentials));
    
    // Create transport based on provider
    const transportConfig = {
      host: credentials.smtpHost,
      port: credentials.smtpPort,
      secure: credentials.smtpSecure || false,
      auth: {
        user: credentials.username || emailSettings.email,
        pass: credentials.password
      }
    };
    
    const transporter = nodemailer.createTransport(transportConfig);
    
    // Extract the email address from the "From" field
    const replyToEmail = email.from.match(/<([^>]+)>/) || email.from.match(/([^<\s]+)$/);
    const replyTo = replyToEmail ? replyToEmail[1] : email.from;
    
    // Prepare the message
    const subject = email.subject?.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject || '(No subject)'}`;
    
    const messageContent = editedResponse || emailResponse.draftResponse;
    
    // Send the email
    await transporter.sendMail({
      from: emailSettings.email,
      to: replyTo,
      subject,
      text: messageContent,
      references: email.messageId,
      inReplyTo: email.messageId
    });
    
    // Update the email response status
    await storage.updateEmailResponse(responseId, {
      status: 'sent',
      sentAt: new Date(),
      draftResponse: messageContent // Update with any edits
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}