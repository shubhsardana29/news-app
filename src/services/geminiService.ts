import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');

export async function analyzeNewsContent(title: string, content: string, description?: string) {
  console.log('Analyzing news content:', { title, description });
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
As an AI-powered news analyst, your task is to categorize the following news article into 1-3 specific, focused groups. These groups should represent the core events, ongoing stories, or primary themes of the article. Avoid broad or overly generic categories to ensure relevance for users who wish to follow similar news developments.

Here is the article for analysis:

**News Title:** ${title}
**News Description:** ${description}
**News Content:** ${content.substring(0, 1000)}... (truncated for brevity)

Guidelines for creating groups:
1. **Specificity**: Focus on key events or stories rather than general topics.
2. **Ongoing Narratives**: Consider how this news fits into larger, developing stories.
3. **Key Details**: Reflect critical actors, locations, or implications mentioned in the article.
4. **Significance**: Capture why this news matters or its potential impact.

Each group should have a:
- **name**: Concise but specific, summarizing the group.
- **description**: Provide context about the group, linking it to broader narratives.

Output the response in the following format as a JSON array with 1-3 group objects:

Example:
[
  {
    "name": "2024 US-China Tech Sanctions",
    "description": "Ongoing developments regarding technological restrictions between the US and China, with a focus on semiconductor trade policies."
  },
  {
    "name": "Global Semiconductor Industry Shifts",
    "description": "Changes in the semiconductor industry due to geopolitical tensions and new international agreements."
  }
]

Now, based on the provided article, generate 1-3 appropriate groups.
`;

  try {
    console.log('Sending prompt to Gemini API');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log('Received response from Gemini API:', text);

    try {
      const parsedResult = JSON.parse(text);
      console.log('Successfully parsed Gemini response:', parsedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw Gemini response:', text);
      return [];
    }
  } catch (error) {
    console.error("Failed to analyze news content with Gemini:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return [];
  }
}

// Helper function to validate the Gemini API response
export function validateGeminiResponse(response: any): boolean {
  if (!Array.isArray(response)) {
    console.error('Gemini response is not an array');
    return false;
  }
  if (response.length === 0) {
    console.warn('Gemini response is an empty array');
    return true; // This might be valid in some cases
  }

  for (const group of response) {
    if (typeof group !== 'object' || group === null) {
      console.error('Group is not an object:', group);
      return false;
    }
    if (typeof group.name !== 'string' || typeof group.description !== 'string') {
      console.error('Group is missing name or description:', group);
      return false;
    }
  }

  return true;
}
