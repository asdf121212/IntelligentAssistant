import { 
  User, InsertUser, 
  Context, InsertContext, 
  Task, InsertTask, 
  Conversation, InsertConversation, 
  Message, InsertMessage,
  LearningProgress, InsertLearningProgress,
  EmailSettings, InsertEmailSettings,
  Email, InsertEmail,
  EmailResponse, InsertEmailResponse,
  users, contexts, tasks, conversations, messages, learningProgress,
  emailSettings as emailSettingsTable, emails as emailsTable, emailResponses as emailResponsesTable
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email Settings
  getEmailSettings(userId: number): Promise<EmailSettings | undefined>;
  createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
  updateEmailSettings(userId: number, settings: Partial<EmailSettings>): Promise<EmailSettings | undefined>;
  deleteEmailSettings(userId: number): Promise<boolean>;
  
  // Emails
  getEmails(userId: number, options?: { needsResponse?: boolean, limit?: number, offset?: number }): Promise<Email[]>;
  getEmail(id: number): Promise<Email | undefined>;
  getEmailByMessageId(messageId: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: number, email: Partial<Email>): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  
  // Email Responses
  getEmailResponses(userId: number, options?: { emailId?: number, status?: string }): Promise<EmailResponse[]>;
  getEmailResponse(id: number): Promise<EmailResponse | undefined>;
  createEmailResponse(response: InsertEmailResponse): Promise<EmailResponse>;
  updateEmailResponse(id: number, response: Partial<EmailResponse>): Promise<EmailResponse | undefined>;
  deleteEmailResponse(id: number): Promise<boolean>;
  
  // Contexts
  getContexts(userId: number): Promise<Context[]>;
  getContext(id: number): Promise<Context | undefined>;
  createContext(context: InsertContext): Promise<Context>;
  updateContext(id: number, context: Partial<Context>): Promise<Context | undefined>;
  deleteContext(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Conversations
  getConversations(userId: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Learning Progress
  getLearningProgress(userId: number): Promise<LearningProgress[]>;
  getLearningProgressByCategory(userId: number, category: string): Promise<LearningProgress | undefined>;
  updateLearningProgress(userId: number, category: string, progress: number): Promise<LearningProgress>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contexts: Map<number, Context>;
  private tasks: Map<number, Task>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private learningProgress: Map<number, LearningProgress>;
  
  // Email-related storage
  private emailSettings: Map<number, EmailSettings>;
  private emails: Map<number, Email>;
  private emailResponses: Map<number, EmailResponse>;
  
  sessionStore: session.SessionStore;
  
  private userId: number;
  private contextId: number;
  private taskId: number;
  private conversationId: number;
  private messageId: number;
  private learningProgressId: number;
  private emailSettingsId: number;
  private emailId: number;
  private emailResponseId: number;

  constructor() {
    this.users = new Map();
    this.contexts = new Map();
    this.tasks = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.learningProgress = new Map();
    
    // Initialize email-related maps
    this.emailSettings = new Map();
    this.emails = new Map();
    this.emailResponses = new Map();
    
    this.userId = 1;
    this.contextId = 1;
    this.taskId = 1;
    this.conversationId = 1;
    this.messageId = 1;
    this.learningProgressId = 1;
    this.emailSettingsId = 1;
    this.emailId = 1;
    this.emailResponseId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Context methods
  async getContexts(userId: number): Promise<Context[]> {
    return Array.from(this.contexts.values()).filter(
      (context) => context.userId === userId
    );
  }
  
  async getContext(id: number): Promise<Context | undefined> {
    return this.contexts.get(id);
  }
  
  async createContext(insertContext: InsertContext): Promise<Context> {
    const id = this.contextId++;
    const now = new Date();
    const context: Context = { 
      ...insertContext, 
      id, 
      createdAt: now 
    };
    this.contexts.set(id, context);
    return context;
  }
  
  async updateContext(id: number, updatedContext: Partial<Context>): Promise<Context | undefined> {
    const context = this.contexts.get(id);
    if (!context) return undefined;
    
    const updated = { ...context, ...updatedContext };
    this.contexts.set(id, updated);
    return updated;
  }
  
  async deleteContext(id: number): Promise<boolean> {
    return this.contexts.delete(id);
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updatedTask: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updated = { ...task, ...updatedTask };
    this.tasks.set(id, updated);
    return updated;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Conversation methods
  async getConversations(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.userId === userId
    );
  }
  
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const now = new Date();
    const conversation: Conversation = { 
      ...insertConversation, 
      id, 
      createdAt: now
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async deleteConversation(id: number): Promise<boolean> {
    return this.conversations.delete(id);
  }
  
  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.conversationId === conversationId
    );
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }
  
  // Email Settings methods
  async getEmailSettings(userId: number): Promise<EmailSettings | undefined> {
    return Array.from(this.emailSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }
  
  async createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const id = this.emailSettingsId++;
    const now = new Date();
    const emailSettings: EmailSettings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now,
      lastSynced: null
    };
    this.emailSettings.set(id, emailSettings);
    return emailSettings;
  }
  
  async updateEmailSettings(userId: number, updatedSettings: Partial<EmailSettings>): Promise<EmailSettings | undefined> {
    const existingSettings = await this.getEmailSettings(userId);
    if (!existingSettings) return undefined;
    
    const now = new Date();
    const updated = { 
      ...existingSettings, 
      ...updatedSettings,
      updatedAt: now
    };
    this.emailSettings.set(existingSettings.id, updated);
    return updated;
  }
  
  async deleteEmailSettings(userId: number): Promise<boolean> {
    const settings = await this.getEmailSettings(userId);
    if (!settings) return false;
    return this.emailSettings.delete(settings.id);
  }
  
  // Email methods
  async getEmails(userId: number, options?: { needsResponse?: boolean; limit?: number; offset?: number }): Promise<Email[]> {
    let emails = Array.from(this.emails.values()).filter(
      (email) => email.userId === userId
    );
    
    // Apply filters
    if (options?.needsResponse !== undefined) {
      emails = emails.filter(email => email.needsResponse === options.needsResponse);
    }
    
    // Sort by date, newest first
    emails.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      emails = emails.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      emails = emails.slice(0, options.limit);
    }
    
    return emails;
  }
  
  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }
  
  async getEmailByMessageId(messageId: string): Promise<Email | undefined> {
    return Array.from(this.emails.values()).find(
      (email) => email.messageId === messageId
    );
  }
  
  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.emailId++;
    const now = new Date();
    const email: Email = {
      ...insertEmail,
      id,
      createdAt: now
    };
    this.emails.set(id, email);
    return email;
  }
  
  async updateEmail(id: number, updatedEmail: Partial<Email>): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;
    
    const updated = { ...email, ...updatedEmail };
    this.emails.set(id, updated);
    return updated;
  }
  
  async deleteEmail(id: number): Promise<boolean> {
    return this.emails.delete(id);
  }
  
  // Email Response methods
  async getEmailResponses(userId: number, options?: { emailId?: number; status?: string }): Promise<EmailResponse[]> {
    let responses = Array.from(this.emailResponses.values()).filter(
      (response) => response.userId === userId
    );
    
    // Apply filters
    if (options?.emailId !== undefined) {
      responses = responses.filter(response => response.emailId === options.emailId);
    }
    
    if (options?.status !== undefined) {
      responses = responses.filter(response => response.status === options.status);
    }
    
    // Sort by creation date, newest first
    responses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return responses;
  }
  
  async getEmailResponse(id: number): Promise<EmailResponse | undefined> {
    return this.emailResponses.get(id);
  }
  
  async createEmailResponse(insertResponse: InsertEmailResponse): Promise<EmailResponse> {
    const id = this.emailResponseId++;
    const now = new Date();
    const response: EmailResponse = {
      ...insertResponse,
      id,
      createdAt: now,
      updatedAt: now,
      sentAt: null
    };
    this.emailResponses.set(id, response);
    return response;
  }
  
  async updateEmailResponse(id: number, updatedResponse: Partial<EmailResponse>): Promise<EmailResponse | undefined> {
    const response = this.emailResponses.get(id);
    if (!response) return undefined;
    
    const now = new Date();
    const updated = { 
      ...response, 
      ...updatedResponse,
      updatedAt: now
    };
    this.emailResponses.set(id, updated);
    return updated;
  }
  
  async deleteEmailResponse(id: number): Promise<boolean> {
    return this.emailResponses.delete(id);
  }

  // Learning Progress methods
  async getLearningProgress(userId: number): Promise<LearningProgress[]> {
    return Array.from(this.learningProgress.values()).filter(
      (progress) => progress.userId === userId
    );
  }
  
  async getLearningProgressByCategory(userId: number, category: string): Promise<LearningProgress | undefined> {
    return Array.from(this.learningProgress.values()).find(
      (progress) => progress.userId === userId && progress.category === category
    );
  }
  
  async updateLearningProgress(userId: number, category: string, progress: number): Promise<LearningProgress> {
    const existingProgress = await this.getLearningProgressByCategory(userId, category);
    
    if (existingProgress) {
      const updated = { ...existingProgress, progress };
      this.learningProgress.set(existingProgress.id, updated);
      return updated;
    } else {
      const id = this.learningProgressId++;
      const newProgress: LearningProgress = {
        id,
        userId,
        category,
        progress
      };
      this.learningProgress.set(id, newProgress);
      return newProgress;
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Context methods
  async getContexts(userId: number): Promise<Context[]> {
    return db.select().from(contexts).where(eq(contexts.userId, userId));
  }

  async getContext(id: number): Promise<Context | undefined> {
    const [context] = await db.select().from(contexts).where(eq(contexts.id, id));
    return context;
  }

  async createContext(insertContext: InsertContext): Promise<Context> {
    const [context] = await db.insert(contexts).values({
      ...insertContext,
      createdAt: new Date()
    }).returning();
    return context;
  }

  async updateContext(id: number, updatedContext: Partial<Context>): Promise<Context | undefined> {
    const [updated] = await db.update(contexts)
      .set(updatedContext)
      .where(eq(contexts.id, id))
      .returning();
    return updated;
  }

  async deleteContext(id: number): Promise<boolean> {
    const result = await db.delete(contexts).where(eq(contexts.id, id));
    return !!result;
  }

  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      createdAt: new Date()
    }).returning();
    return task;
  }

  async updateTask(id: number, updatedTask: Partial<Task>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks)
      .set(updatedTask)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return !!result;
  }

  // Conversation methods
  async getConversations(userId: number): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({
      ...insertConversation,
      createdAt: new Date()
    }).returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return !!result;
  }

  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      ...insertMessage,
      createdAt: new Date()
    }).returning();
    return message;
  }

  // Email Settings methods
  async getEmailSettings(userId: number): Promise<EmailSettings | undefined> {
    const [settings] = await db.select()
      .from(emailSettingsTable)
      .where(eq(emailSettingsTable.userId, userId));
    return settings;
  }

  async createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const now = new Date();
    const [emailSettings] = await db.insert(emailSettingsTable).values({
      ...settings,
      createdAt: now,
      updatedAt: now,
      lastSynced: null
    }).returning();
    return emailSettings;
  }

  async updateEmailSettings(userId: number, updatedSettings: Partial<EmailSettings>): Promise<EmailSettings | undefined> {
    const now = new Date();
    const [updated] = await db.update(emailSettingsTable)
      .set({
        ...updatedSettings,
        updatedAt: now
      })
      .where(eq(emailSettingsTable.userId, userId))
      .returning();
    return updated;
  }

  async deleteEmailSettings(userId: number): Promise<boolean> {
    const result = await db.delete(emailSettingsTable)
      .where(eq(emailSettingsTable.userId, userId));
    return !!result;
  }

  // Email methods
  async getEmails(userId: number, options?: { needsResponse?: boolean; limit?: number; offset?: number }): Promise<Email[]> {
    let query = db.select().from(emailsTable);
    
    // Build conditions array
    const conditions = [eq(emailsTable.userId, userId)];
    
    // Add optional filters to conditions
    if (options?.needsResponse !== undefined) {
      conditions.push(eq(emailsTable.needsResponse, options.needsResponse));
    }
    
    // Apply all conditions with AND
    query = query.where(and(...conditions));
    
    // Order by date, newest first
    query = query.orderBy(desc(emailsTable.date));
    
    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
      
      if (options?.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }
    
    return query;
  }

  async getEmail(id: number): Promise<Email | undefined> {
    const [email] = await db.select()
      .from(emailsTable)
      .where(eq(emailsTable.id, id));
    return email;
  }

  async getEmailByMessageId(messageId: string): Promise<Email | undefined> {
    const [email] = await db.select()
      .from(emailsTable)
      .where(eq(emailsTable.messageId, messageId));
    return email;
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db.insert(emailsTable).values({
      ...insertEmail,
      createdAt: new Date()
    }).returning();
    return email;
  }

  async updateEmail(id: number, updatedEmail: Partial<Email>): Promise<Email | undefined> {
    const [updated] = await db.update(emailsTable)
      .set(updatedEmail)
      .where(eq(emailsTable.id, id))
      .returning();
    return updated;
  }

  async deleteEmail(id: number): Promise<boolean> {
    const result = await db.delete(emailsTable).where(eq(emailsTable.id, id));
    return !!result;
  }

  // Email Response methods
  async getEmailResponses(userId: number, options?: { emailId?: number; status?: string }): Promise<EmailResponse[]> {
    let query = db.select().from(emailResponsesTable);
    
    // Build conditions array
    const conditions = [eq(emailResponsesTable.userId, userId)];
    
    // Add optional filters to conditions
    if (options?.emailId !== undefined) {
      conditions.push(eq(emailResponsesTable.emailId, options.emailId));
    }
    
    if (options?.status !== undefined) {
      conditions.push(eq(emailResponsesTable.status, options.status));
    }
    
    // Apply all conditions with AND
    query = query.where(and(...conditions));
    
    // Order by creation date, newest first
    query = query.orderBy(desc(emailResponsesTable.createdAt));
    
    return query;
  }

  async getEmailResponse(id: number): Promise<EmailResponse | undefined> {
    const [response] = await db.select()
      .from(emailResponsesTable)
      .where(eq(emailResponsesTable.id, id));
    return response;
  }

  async createEmailResponse(insertResponse: InsertEmailResponse): Promise<EmailResponse> {
    const now = new Date();
    const [response] = await db.insert(emailResponsesTable).values({
      ...insertResponse,
      createdAt: now,
      updatedAt: now,
      sentAt: null
    }).returning();
    return response;
  }

  async updateEmailResponse(id: number, updatedResponse: Partial<EmailResponse>): Promise<EmailResponse | undefined> {
    const now = new Date();
    const [updated] = await db.update(emailResponsesTable)
      .set({
        ...updatedResponse,
        updatedAt: now
      })
      .where(eq(emailResponsesTable.id, id))
      .returning();
    return updated;
  }

  async deleteEmailResponse(id: number): Promise<boolean> {
    const result = await db.delete(emailResponsesTable).where(eq(emailResponsesTable.id, id));
    return !!result;
  }

  // Learning Progress methods
  async getLearningProgress(userId: number): Promise<LearningProgress[]> {
    return db.select()
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId));
  }

  async getLearningProgressByCategory(userId: number, category: string): Promise<LearningProgress | undefined> {
    const [progress] = await db.select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.category, category)
        )
      );
    return progress;
  }

  async updateLearningProgress(userId: number, category: string, progress: number): Promise<LearningProgress> {
    const existingProgress = await this.getLearningProgressByCategory(userId, category);

    if (existingProgress) {
      const [updated] = await db.update(learningProgress)
        .set({ progress })
        .where(eq(learningProgress.id, existingProgress.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(learningProgress)
        .values({
          userId,
          category,
          progress
        })
        .returning();
      return newProgress;
    }
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();
