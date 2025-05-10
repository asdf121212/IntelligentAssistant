import OpenAI from "openai";
import { Context, Message } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-key" 
});

// Helper to format contexts into a string
function formatContextsForPrompt(contexts: Context[]): string {
  if (contexts.length === 0) {
    return "No contexts available.";
  }
  
  return contexts.map(context => {
    return `CONTEXT: ${context.name}\n${context.content.substring(0, 1000)}${context.content.length > 1000 ? '...' : ''}`;
  }).join('\n\n');
}

// Helper to format messages into a string for context
function formatMessagesForContext(messages: Message[]): string {
  return messages.map(msg => {
    return `${msg.role.toUpperCase()}: ${msg.content}`;
  }).join('\n\n');
}

export async function generateEmailDraft(
  subject: string,
  purpose: string,
  details: string,
  tone: string,
  contexts: Context[]
): Promise<string> {
  const contextText = formatContextsForPrompt(contexts);
  
  const prompt = `
You are an AI assistant that helps draft professional emails. 
Based on the following information, please create a complete email draft.

SUBJECT: ${subject}
PURPOSE: ${purpose}
DETAILS: ${details}
TONE: ${tone}

RELEVANT CONTEXT:
${contextText}

Please generate a professional email that includes:
- Appropriate greeting
- Clear and concise content addressing the purpose
- Proper closing
- Name signature

Format the email as if it were ready to send.
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Sorry, I couldn't generate an email draft at this time.";
  } catch (error) {
    console.error("Error generating email draft:", error);
    throw new Error("Failed to generate email draft");
  }
}

export async function summarizeDocument(text: string): Promise<string> {
  try {
    // Truncate text if it's too long
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + "..." : text;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that summarizes documents. Provide a concise summary highlighting key points, main ideas, and important details."
        },
        {
          role: "user",
          content: `Please summarize the following document: \n\n${truncatedText}`
        }
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content || "Sorry, I couldn't summarize this document.";
  } catch (error) {
    console.error("Error summarizing document:", error);
    throw new Error("Failed to summarize document");
  }
}

export async function generateSolution(
  userQuery: string,
  contexts: Context[],
  previousMessages: Message[]
): Promise<string> {
  try {
    const contextText = formatContextsForPrompt(contexts);
    const conversationHistory = formatMessagesForContext(previousMessages);
    
    const systemPrompt = `
You are DoMyJob, an AI assistant that helps people complete work tasks efficiently.
You use available contexts to provide accurate, helpful responses.

AVAILABLE CONTEXTS:
${contextText}

CONVERSATION HISTORY:
${conversationHistory}

Your task is to:
1. Understand the user's request in relation to their job responsibilities
2. Use the context information to provide the most relevant response
3. If asked to generate content (emails, reports, etc.), make it professional and ready to use
4. If the context doesn't contain enough information, acknowledge limitations and ask for clarification
5. For technical questions, provide step-by-step solutions when possible

Always maintain a helpful, professional tone.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error generating solution:", error);
    throw new Error("Failed to generate solution");
  }
}
