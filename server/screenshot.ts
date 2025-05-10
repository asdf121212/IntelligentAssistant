import { openai } from './openai';
import { storage } from './storage';
import { Request, Response } from 'express';

/**
 * Process a screenshot to extract text and context
 * @param dataUrl Base64 encoded image data
 * @returns Extracted text and analysis
 */
export async function processScreenshot(dataUrl: string) {
  try {
    // Extract base64 data from the data URL
    const base64Data = dataUrl.split(',')[1];
    
    // Prepare the image for OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this screenshot and extract all visible text content. Also provide a brief summary of what you see in the image (UI elements, layout, purpose of the screen)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Data}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return {
      success: true,
      result: response.choices[0].message.content,
    };
  } catch (error: any) {
    console.error('Error processing screenshot:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while processing the screenshot'
    };
  }
}

/**
 * Save screenshot analysis as a context for future reference
 * @param userId User ID
 * @param name Context name
 * @param content Analysis content
 * @returns Created context
 */
export async function saveScreenshotAsContext(userId: number, name: string, content: string) {
  try {
    const context = await storage.createContext({
      userId,
      name,
      type: 'screenshot',
      content,
      active: true,
    });
    
    return {
      success: true,
      context
    };
  } catch (error: any) {
    console.error('Error saving screenshot as context:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while saving the context'
    };
  }
}

/**
 * API route handler for processing screenshots
 */
export async function handleProcessScreenshot(req: Request, res: Response) {
  try {
    const { dataUrl } = req.body;
    
    if (!dataUrl) {
      return res.status(400).json({ error: 'Screenshot data is required' });
    }
    
    const result = await processScreenshot(dataUrl);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.status(200).json({ result: result.result });
  } catch (error: any) {
    console.error('Error in screenshot API:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
}

/**
 * API route handler for saving screenshot analysis as context
 */
export async function handleSaveScreenshotContext(req: Request, res: Response) {
  try {
    const { name, content } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    const result = await saveScreenshotAsContext(userId, name, content);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.status(201).json(result.context);
  } catch (error: any) {
    console.error('Error in save screenshot context API:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
}