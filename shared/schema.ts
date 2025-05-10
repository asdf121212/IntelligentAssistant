import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  emailProvider: text("email_provider").notNull(), // gmail, outlook, imap, etc.
  email: text("email").notNull(),
  // Encrypted credentials for email access
  credentials: text("credentials").notNull(),
  active: boolean("active").default(true),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSynced: true,
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  messageId: text("message_id").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  cc: text("cc"),
  subject: text("subject"),
  body: text("body").notNull(),
  html: text("html"),
  date: timestamp("date").notNull(),
  isRead: boolean("is_read").default(false),
  needsResponse: boolean("needs_response").default(false),
  responseGenerated: boolean("response_generated").default(false),
  folderPath: text("folder_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
});

export const emailResponses = pgTable("email_responses", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull(),
  userId: integer("user_id").notNull(),
  draftResponse: text("draft_response").notNull(),
  suggestedActions: jsonb("suggested_actions"),
  status: text("status").notNull().default("draft"), // draft, edited, sent
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailResponseSchema = createInsertSchema(emailResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
});

export const contexts = pgTable("contexts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // pdf, text, etc.
  content: text("content").notNull(),
  fileSize: integer("file_size"),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

export const insertContextSchema = createInsertSchema(contexts).omit({
  id: true,
  createdAt: true,
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  content: text("content").notNull(),
  role: text("role").notNull(), // user, assistant
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  progress: integer("progress").notNull(),
});

export const insertLearningProgressSchema = createInsertSchema(learningProgress).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertEmailResponse = z.infer<typeof insertEmailResponseSchema>;
export type EmailResponse = typeof emailResponses.$inferSelect;

export type InsertContext = z.infer<typeof insertContextSchema>;
export type Context = typeof contexts.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertLearningProgress = z.infer<typeof insertLearningProgressSchema>;
export type LearningProgress = typeof learningProgress.$inferSelect;
