
import { GoogleGenAI } from "@google/genai";
import { Personality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCommentary = async (
  event: string, 
  playerScore: number, 
  opponentScore: number, 
  personality: Personality,
  isGameOver: boolean = false,
  recentHistory: string[] = []
): Promise<string> => {
  try {
    let personalityPrompt = "";
    switch (personality) {
      case 'enthusiastic':
        personalityPrompt = "You are an incredibly energetic and loud sports commentator. Use caps, exclamation marks, and intense sports metaphors. You LOVE the drama.";
        break;
      case 'sarcastic':
        personalityPrompt = "You are a witty, dry, and slightly condescending commentator. You find human effort amusing and machine precision expected. Be biting and clever.";
        break;
      case 'neutral':
        personalityPrompt = "You are a professional, matter-of-fact sports broadcaster. Be descriptive, analytical, and objective. Focus on the stats and the play.";
        break;
    }

    const historyContext = recentHistory.length > 0 
      ? `DO NOT repeat these recent phrases: [${recentHistory.join(", ")}]. ` 
      : "";

    const context = isGameOver 
      ? `The match is OVER! Final score - Player: ${playerScore}, Opponent: ${opponentScore}. Provide a final summary.`
      : `The player just: ${event}. Current score - Player: ${playerScore}, Opponent: ${opponentScore}. Reaction required.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${personalityPrompt} 
      ${historyContext}
      Context: ${context}
      Limit your response to 15 words maximum. Be punchy, fresh, and DO NOT use the same words twice if possible. Vary your vocabulary significantly.`,
      config: {
        temperature: 1.0, // Increased temperature for more variety
        topP: 0.9,
        maxOutputTokens: 60,
      }
    });

    return response.text?.trim() || "What a play!";
  } catch (error) {
    console.error("Gemini Commentary Error:", error);
    return "The crowd goes wild!";
  }
};
