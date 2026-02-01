
import { GoogleGenAI } from "@google/genai";
import { Personality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCommentary = async (
  event: string, 
  playerScore: number, 
  opponentScore: number, 
  personality: Personality,
  isGameOver: boolean = false
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

    const context = isGameOver 
      ? `The match is OVER! Final score - Player: ${playerScore}, Opponent: ${opponentScore}. Provide a final summary of the winner's dominance and the loser's performance.`
      : `The player just: ${event}. Current score - Player: ${playerScore}, Opponent: ${opponentScore}. Reaction required.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${personalityPrompt} 
      Context: ${context}
      Limit your response to 20 words maximum. Be punchy and stay in character.`,
      config: {
        temperature: 0.9,
        topP: 0.8,
        maxOutputTokens: 60,
      }
    });

    return response.text?.trim() || "What a play!";
  } catch (error) {
    console.error("Gemini Commentary Error:", error);
    return "The crowd goes wild!";
  }
};
