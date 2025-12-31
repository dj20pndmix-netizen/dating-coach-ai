
import type { AnalysisResult, SimpleResponse } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const parseAnalysis = (text: string): AnalysisResult => {
  try {
    const lines = text.trim().split('\n');
    const nameLine = lines.find(line => line.toUpperCase().startsWith('NAME:'));
    const summaryLine = lines.find(line => line.toUpperCase().startsWith('SUMMARY:'));

    const detectedName = nameLine ? nameLine.substring(5).trim() : 'Unknown';
    const summary = summaryLine ? summaryLine.substring(8).trim() : 'Could not generate summary.';
    
    const replies: SimpleResponse[] = [];
    const replyStartIndex = lines.findIndex(line => line.includes('✅ REPLY'));
    
    if (replyStartIndex === -1) {
      throw new Error("No replies found in the expected format (missing '✅').");
    }

    const replyText = lines.slice(replyStartIndex).join('\n');
    const parts = replyText.split('✅').filter(p => p.trim());

    for (const part of parts) {
      const replyLines = part.trim().split('\n');
      const titleLine = replyLines[0]?.trim();
      const replyContent = replyLines.slice(1).join('\n').trim();
      
      if (titleLine && replyContent) {
           replies.push({
              title: `✅ ${titleLine}`,
              reply: replyContent,
          });
      }
    }
    
    if (replies.length === 0) {
      throw new Error("Could not parse any valid replies from the AI response.");
    }

    return { detectedName, summary, replies };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Return a default structure so the app doesn't crash, but show the raw text as a reply.
    return {
      detectedName: "Error",
      summary: "Could not parse AI response.",
      replies: [{ title: "Raw AI Response (Please try again)", reply: text }]
    }
  }
};
