
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, BOSS_SYSTEM_INSTRUCTION, GET_NUMBER_INSTRUCTION, ASK_LOCATION_INSTRUCTION, ASK_FOR_PHOTO_INSTRUCTION } from '../constants';
import { ChatSession } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Determines the time of day to provide real-time context to the AI.
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Determines the day and corresponding status (weekday/weekend/holiday).
function getDynamicContext(): { context: string, isChristmas: boolean } {
    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    const month = now.getMonth(); // 0-indexed (11 is December)
    const day = now.getDate();

    if (month === 11 && day === 25) {
        return {
            context: `\n\nCURRENT DAY & STATUS (VERY IMPORTANT): Today is Christmas Day! Merry Christmas! I'm currently enjoying the holiday festivities at home.`,
            isChristmas: true,
        };
    }
    
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
    const status = isWeekend ? "It's the weekend, and I'm at home." : `It's ${dayOfWeek}, and I'm likely at home after work.`;
    
    return {
        context: `\n\nCURRENT DAY & STATUS (VERY IMPORTANT): Today is ${dayOfWeek}. ${status}`,
        isChristmas: false,
    };
}


export async function analyzeConversation(
  imageBase64: string, 
  mimeType: string, 
  isBossMode: boolean, 
  goal: ChatSession['goal'],
  outfitSent: boolean,
  isAskingLocation: boolean,
  isAskingForPhoto: boolean,
  history: string[] = [],
  personalContext?: string,
  feedbackLog?: ChatSession['feedbackLog']
): Promise<string | undefined> {
  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: imageBase64,
    },
  };

  const textPart = {
    text: "Analyze this dating conversation screenshot and provide feedback and response suggestions based on your instructions."
  };

  const baseInstruction = isBossMode ? BOSS_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION;

  const timeOfDay = getCurrentTimeOfDay();
  const { context: dynamicContext, isChristmas } = getDynamicContext();

  const timeContext = `\n\nCURRENT TIME CONTEXT (VERY IMPORTANT): It is currently ${timeOfDay}. Ensure all greetings and time-sensitive references in your replies are appropriate for the ${timeOfDay}. For example, use 'Good evening' not 'Good afternoon' if it is evening.`;
  
  let systemInstruction = baseInstruction + dynamicContext + timeContext;

  if (isChristmas) {
      const holidayContext = `\n\nHOLIDAY CONTEXT (VERY IMPORTANT): It's Christmas Day! Please adopt a warm, festive, and cheerful tone. Your suggested replies should reflect the holiday spirit. Consider suggesting the user wish them a Merry Christmas or ask about their holiday plans if it feels natural in the conversation.`;
      systemInstruction += holidayContext;
  }

  if (goal === 'getNumber') {
      systemInstruction += GET_NUMBER_INSTRUCTION;
  }
  
  if (personalContext) {
    const userContext = `\n\nUSER'S PERSONAL CONTEXT:
${personalContext}
Use this information to tailor your replies and make them more personal and relevant to the user's current situation.`;
    systemInstruction += userContext;
  }

  if (feedbackLog && feedbackLog.length > 0) {
      const positive = feedbackLog.filter(f => f.rating === 'positive').map(f => f.reply);
      const negative = feedbackLog.filter(f => f.rating === 'negative').map(f => f.reply);
      
      let feedbackInstruction = `\n\nUSER FEEDBACK ON PREVIOUS SUGGESTIONS:`;
      if (positive.length > 0) {
          feedbackInstruction += `\n- The user LIKED these styles of replies: ${positive.slice(-3).join('; ')}`;
      }
      if (negative.length > 0) {
          feedbackInstruction += `\n- The user DISLIKED these styles (avoid them): ${negative.slice(-3).join('; ')}`;
      }
      feedbackInstruction += `\nCalibrate your tone based on this feedback.`;
      systemInstruction += feedbackInstruction;
  }

  if (outfitSent) {
    const outfitContext = `\n\nADDITIONAL CONTEXT (VERY IMPORTANT): The user (ME, on the right of the screenshot) has just sent a photo of their outfit. The current screenshot shows the other person's reaction. Generate replies that are confident and playful in response to their comments on the outfit.`;
    systemInstruction += outfitContext;
  }
  
  if (isAskingLocation) {
    systemInstruction += ASK_LOCATION_INSTRUCTION;
  }

  if (isAskingForPhoto) {
    systemInstruction += ASK_FOR_PHOTO_INSTRUCTION;
  }

  if (history.length > 0) {
    const historyContext = `\n\nCONVERSATION HISTORY (SUMMARIES OF PREVIOUS TURNS):
${history.map(h => `- ${h}`).join('\n')}`;
    systemInstruction += historyContext;
  }


  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [imagePart, textPart]
        },
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Let the caller handle the error display
    throw new Error("Failed to get a response from the AI. The service might be temporarily unavailable.");
  }
}

export async function translateText(textToTranslate: string): Promise<string | undefined> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text to English, keeping the meaning and tone the same. Provide only the translated text, with no extra explanation or labels.\n\nText to translate: "${textToTranslate}"`
        });
        return response.text;
    } catch (error) {
        console.error("Error translating text:", error);
        return "Translation failed.";
    }
}

export async function translateToLanguage(text: string, languageName: string): Promise<string | undefined> {
    if (!text.trim()) return "";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following English text to ${languageName}. Provide ONLY the translation, with no extra formatting, labels, or explanations.\n\nEnglish text: "${text}"`
        });
        return response.text;
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error(`Failed to translate to ${languageName}.`);
    }
}
