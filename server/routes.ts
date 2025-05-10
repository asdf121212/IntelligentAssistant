import type { Express, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, getUserId } from "./types";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertContextSchema, 
  insertTaskSchema, 
  insertMessageSchema, 
  insertConversationSchema,
  insertEmailSettingsSchema,
  insertEmailResponseSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { generateEmailDraft, generateSolution, summarizeDocument } from "./openai";
import { processPDF } from "./pdf";
import { syncEmails, generateEmailResponse, sendEmail, encrypt } from "./email";
import { handleProcessScreenshot, handleSaveScreenshotContext } from "./screenshot";
import multer from "multer";
import { z } from "zod";

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Contexts
  app.get("/api/contexts", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const contexts = await storage.getContexts(userId);
      res.json(contexts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/contexts", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const contextData = insertContextSchema.parse({ ...req.body, userId });
      const context = await storage.createContext(contextData);
      res.status(201).json(context);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/contexts/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const contextId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const existingContext = await storage.getContext(contextId);
      if (!existingContext) {
        return res.status(404).json({ message: "Context not found" });
      }
      
      if (existingContext.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedContext = await storage.updateContext(contextId, req.body);
      res.json(updatedContext);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/contexts/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const contextId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const existingContext = await storage.getContext(contextId);
      if (!existingContext) {
        return res.status(404).json({ message: "Context not found" });
      }
      
      if (existingContext.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteContext(contextId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // File upload for context
  app.post("/api/upload", ensureAuthenticated, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user?.id;
      const file = req.file;
      const fileName = req.body.name || file.originalname;
      let fileContent = "";
      let pageCount = 0;
      
      if (file.mimetype === "application/pdf") {
        const result = await processPDF(file.buffer);
        fileContent = result.text;
        pageCount = result.numPages;
      } else {
        // Assume it's plain text
        fileContent = file.buffer.toString("utf-8");
      }
      
      const contextData = {
        userId,
        name: fileName,
        type: file.mimetype,
        content: fileContent,
        fileSize: file.size,
        pageCount: pageCount || undefined,
        active: true
      };
      
      const context = await storage.createContext(contextData);
      res.status(201).json(context);
    } catch (error) {
      next(error);
    }
  });

  // Tasks
  app.get("/api/tasks", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/tasks/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Conversations and Messages
  app.get("/api/conversations", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/conversations", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const conversationData = insertConversationSchema.parse({ ...req.body, userId });
      const conversation = await storage.createConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/conversations/:id/messages", ensureAuthenticated, async (req, res, next) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/conversations/:id/messages", ensureAuthenticated, async (req, res, next) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Save user message
      const messageData = insertMessageSchema.parse({ 
        ...req.body, 
        conversationId,
        role: "user" 
      });
      
      const message = await storage.createMessage(messageData);
      
      // Get all contexts for this user to provide context for the AI
      const contexts = await storage.getContexts(userId);
      const activeContexts = contexts.filter(context => context.active);
      
      // Get previous messages for context
      const messages = await storage.getMessages(conversationId);
      
      // Generate AI response
      const aiResponse = await generateSolution(
        message.content,
        activeContexts,
        messages
      );
      
      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId,
        content: aiResponse,
        role: "assistant"
      });
      
      // Return both messages
      res.status(201).json([message, aiMessage]);
    } catch (error) {
      next(error);
    }
  });

  // AI Services
  app.post("/api/ai/draft-email", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const emailRequestSchema = z.object({
        subject: z.string(),
        purpose: z.string(),
        details: z.string(),
        tone: z.string()
      });
      
      const emailRequest = emailRequestSchema.parse(req.body);
      
      // Get all contexts for this user to provide context for the AI
      const contexts = await storage.getContexts(userId);
      const activeContexts = contexts.filter(context => context.active);
      
      const emailDraft = await generateEmailDraft(
        emailRequest.subject,
        emailRequest.purpose,
        emailRequest.details,
        emailRequest.tone,
        activeContexts
      );
      
      // Create a task for this email
      await storage.createTask({
        userId,
        title: `Draft email: ${emailRequest.subject}`,
        description: emailRequest.details,
        status: "completed"
      });
      
      // Update learning progress
      await storage.updateLearningProgress(userId, "Email Drafting", 5);
      
      res.json({ email: emailDraft });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/summarize", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const summarizeRequestSchema = z.object({
        contextId: z.number().optional(),
        text: z.string().optional()
      });
      
      const summarizeRequest = summarizeRequestSchema.parse(req.body);
      
      let textToSummarize = summarizeRequest.text || "";
      
      // If contextId is provided, get that specific context
      if (summarizeRequest.contextId) {
        const context = await storage.getContext(summarizeRequest.contextId);
        if (!context || context.userId !== userId) {
          return res.status(404).json({ message: "Context not found" });
        }
        textToSummarize = context.content;
      }
      
      if (!textToSummarize) {
        return res.status(400).json({ message: "No text to summarize" });
      }
      
      const summary = await summarizeDocument(textToSummarize);
      
      // Update learning progress
      await storage.updateLearningProgress(userId, "Documentation Analysis", 5);
      
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  });

  // Learning Progress
  app.get("/api/learning-progress", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const progress = await storage.getLearningProgress(userId);
      
      // If no progress exists yet, create default categories
      if (progress.length === 0) {
        const defaultCategories = [
          { category: "Email Drafting", progress: 10 },
          { category: "Documentation Analysis", progress: 5 },
          { category: "Code Understanding", progress: 0 }
        ];
        
        const promises = defaultCategories.map(cat => 
          storage.updateLearningProgress(userId, cat.category, cat.progress)
        );
        
        const results = await Promise.all(promises);
        res.json(results);
      } else {
        res.json(progress);
      }
    } catch (error) {
      next(error);
    }
  });

  // Email Integration
  // Get email settings
  app.get("/api/email/settings", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const settings = await storage.getEmailSettings(userId);
      
      // If settings exist, don't return the credentials directly
      if (settings) {
        const { credentials, ...safeSettings } = settings;
        res.json({
          ...safeSettings,
          hasCredentials: Boolean(credentials)
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      next(error);
    }
  });

  // Create or update email settings
  app.post("/api/email/settings", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      // Validate the request
      const emailSettingsSchema = z.object({
        emailProvider: z.string(),
        email: z.string().email(),
        credentials: z.object({
          username: z.string().optional(),
          password: z.string(),
          host: z.string(),
          port: z.number(),
          tls: z.boolean().optional(),
          smtpHost: z.string().optional(),
          smtpPort: z.number().optional(),
          smtpSecure: z.boolean().optional()
        }),
        active: z.boolean().optional()
      });
      
      const validatedData = emailSettingsSchema.parse(req.body);
      
      // Encrypt the credentials
      const encryptedCredentials = encrypt(JSON.stringify(validatedData.credentials));
      
      // Check if settings already exist
      const existingSettings = await storage.getEmailSettings(userId);
      
      if (existingSettings) {
        // Update existing settings
        const updatedSettings = await storage.updateEmailSettings(userId, {
          emailProvider: validatedData.emailProvider,
          email: validatedData.email,
          credentials: encryptedCredentials,
          active: validatedData.active ?? true
        });
        
        if (!updatedSettings) {
          return res.status(404).json({ message: "Email settings not found" });
        }
        
        const { credentials, ...safeSettings } = updatedSettings;
        res.json({
          ...safeSettings,
          hasCredentials: Boolean(credentials)
        });
      } else {
        // Create new settings
        const settingsData = {
          userId,
          emailProvider: validatedData.emailProvider,
          email: validatedData.email,
          credentials: encryptedCredentials,
          active: validatedData.active ?? true
        };
        
        const newSettings = await storage.createEmailSettings(settingsData);
        
        const { credentials, ...safeSettings } = newSettings;
        res.status(201).json({
          ...safeSettings,
          hasCredentials: Boolean(credentials)
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Sync emails
  app.post("/api/email/sync", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      const result = await syncEmails(userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error || "Failed to sync emails" });
      }
      
      // Update learning progress
      await storage.updateLearningProgress(userId, "Email Handling", 5);
      
      res.json({ 
        success: true, 
        message: `Successfully synced ${result.count} new emails` 
      });
    } catch (error) {
      next(error);
    }
  });

  // Get emails that need response
  app.get("/api/email/inbox", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const needsResponse = req.query.needsResponse === "true";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const emails = await storage.getEmails(userId, {
        needsResponse: needsResponse || undefined,
        limit,
        offset
      });
      
      res.json(emails);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific email
  app.get("/api/email/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const emailId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const email = await storage.getEmail(emailId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      if (email.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(email);
    } catch (error) {
      next(error);
    }
  });

  // Get email responses
  app.get("/api/email/:id/responses", ensureAuthenticated, async (req, res, next) => {
    try {
      const emailId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const email = await storage.getEmail(emailId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      if (email.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const responses = await storage.getEmailResponses(userId, { emailId });
      res.json(responses);
    } catch (error) {
      next(error);
    }
  });

  // Generate a response for an email
  app.post("/api/email/:id/generate-response", ensureAuthenticated, async (req, res, next) => {
    try {
      const emailId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const email = await storage.getEmail(emailId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      if (email.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await generateEmailResponse(userId, emailId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to generate response" });
      }
      
      await storage.updateEmail(emailId, { responseGenerated: true });
      
      const responses = await storage.getEmailResponses(userId, { emailId });
      
      res.json({
        success: true,
        response: responses[0] || null
      });
    } catch (error) {
      next(error);
    }
  });

  // Update an email response
  app.put("/api/email/response/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const responseId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const response = await storage.getEmailResponse(responseId);
      
      if (!response) {
        return res.status(404).json({ message: "Email response not found" });
      }
      
      if (response.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { draftResponse, status } = req.body;
      
      const updatedResponse = await storage.updateEmailResponse(responseId, {
        draftResponse,
        status,
        updatedAt: new Date()
      });
      
      res.json(updatedResponse);
    } catch (error) {
      next(error);
    }
  });

  // Send an email response
  app.post("/api/email/response/:id/send", ensureAuthenticated, async (req, res, next) => {
    try {
      const responseId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      const response = await storage.getEmailResponse(responseId);
      
      if (!response) {
        return res.status(404).json({ message: "Email response not found" });
      }
      
      if (response.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { editedResponse } = req.body;
      
      const result = await sendEmail(userId, responseId, editedResponse);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error || "Failed to send email" });
      }
      
      // Update learning progress
      await storage.updateLearningProgress(userId, "Email Handling", 10);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Screenshot processing
  app.post("/api/screenshot/process", ensureAuthenticated, async (req, res, next) => {
    try {
      await handleProcessScreenshot(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/screenshot/save-context", ensureAuthenticated, async (req, res, next) => {
    try {
      await handleSaveScreenshotContext(req, res);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
