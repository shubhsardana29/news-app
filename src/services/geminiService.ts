import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');

export async function analyzeNewsContent(title: string, content: string, description: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  Analyze the following news article and determine which specific group(s) it belongs to. The groups should be focused on the main event, topic, or ongoing story in the article, not broad categories. Consider the following aspects:

  1. Key events or incidents
  2. Ongoing political or social issues
  3. Specific sports tournaments or matches
  4. Cultural or entertainment events
  5. Scientific discoveries or technological advancements
  6. Economic trends or business developments
  7. Environmental issues or natural disasters

  Return the result as a JSON array of group objects, each with a 'name' and 'description' field. The name should be concise but specific, and the description should provide context about the ongoing story or event.

  News Title: ${title}
  News Description: ${description}
  News Content: ${content}

  Example outputs:
  [
    {
      "name": "Mumbai Politician Assassination",
      "description": "Coverage of the shooting and its aftermath of a senior politician in Mumbai, India, known for his Bollywood connections"
    },
    {
      "name": "China's Economic Reshoring",
      "description": "Analysis of China's strategy to relocate factories within its own borders for cost-effective production"
    },
    {
      "name": "Women's T20 World Cup 2024",
      "description": "Updates and results from the ongoing Women's T20 Cricket World Cup, focusing on team performances and tournament progression"
    },
    {
      "name": "Taj Mahal Artisan Legacy",
      "description": "Exploration of traditional marble inlay techniques being preserved by descendants of Taj Mahal artisans"
    }
  ]

  Analyze the provided news article and create 1-3 appropriate groups:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to analyze news content with Gemini:", error);
    return [];
  }
}