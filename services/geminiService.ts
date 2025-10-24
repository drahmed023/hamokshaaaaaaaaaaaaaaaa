import { GoogleGenAI, Type } from "@google/genai";
import { Question, Flashcard, MindMapNodeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const examSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A title for the exam based on the text."
    },
    questions: {
      type: Type.ARRAY,
      description: "A list of questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: {
            type: Type.STRING,
            description: "The text of the question."
          },
          options: {
            type: Type.ARRAY,
            description: "A list of 4 multiple-choice options.",
            items: { type: Type.STRING }
          },
          correctAnswer: {
            type: Type.STRING,
            description: "The correct answer from the options list."
          }
        },
        required: ["questionText", "options", "correctAnswer"]
      }
    }
  },
  required: ["title", "questions"]
};

const flashcardsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            front: { type: Type.STRING, description: 'The main term or question for the front of the card.' },
            back: { type: Type.STRING, description: 'The definition or answer for the back of the card.' },
        },
        required: ['front', 'back'],
    },
};

const mindMapSchema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: 'The central topic of the mind map.' },
      children: {
        type: Type.ARRAY,
        description: 'Branches or sub-topics related to the main topic.',
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
            },
          },
          required: ['topic'],
        },
      },
    },
    required: ['topic'],
};

export const generateExamFromText = async (text: string, numQuestions: number): Promise<{ title: string, questions: Omit<Question, 'id'>[] }> => {
  const prompt = `
    Based on the following text, create a multiple-choice quiz with ${numQuestions} questions.
    Each question must have 4 options and only one correct answer.
    Ensure the questions cover the key concepts in the text.
    The entire output must be in English.
    Text:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    const examData = JSON.parse(response.text);
    return examData;

  } catch (error) {
    console.error("Error generating exam:", error);
    throw new Error("Failed to generate exam. Please try again.");
  }
};

export const generateStudyAid = async (text: string, format: 'summary' | 'flashcards' | 'mind-map'): Promise<any> => {
    let prompt: string;
    let schema: object;
    let model = "gemini-2.5-flash";

    switch(format) {
        case 'summary':
            prompt = `Generate a concise summary of the following text. Focus on the main ideas and key takeaways. The entire output must be in English.\nText:\n---\n${text}\n---`;
            schema = { type: Type.STRING, description: 'A concise summary of the text.' };
            break;
        case 'flashcards':
            prompt = `Based on the following text, create 10 flashcards. Each card should have a 'front' (term/question) and a 'back' (definition/answer). Focus on key concepts. The entire output must be in English.\nText:\n---\n${text}\n---`;
            schema = flashcardsSchema;
            break;
        case 'mind-map':
            prompt = `Analyze the following text and generate a mind map summarizing the main ideas and their relationships. Structure it as a nested JSON object with a 'topic' and 'children'. The entire output must be in English.\nText:\n---\n${text}\n---`;
            schema = mindMapSchema;
            model = "gemini-2.5-pro"; // Use a more powerful model for complex structures
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        result: schema
                    }
                }
            },
        });
        
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.result;

    } catch (error) {
        console.error(`Error generating ${format}:`, error);
        throw new Error(`Failed to generate ${format}. Please try again.`);
    }
};


export const getExplanationForAnswer = async (question: string, userAnswer: string, correctAnswer: string): Promise<string> => {
    const prompt = `In English, please explain why the answer "${userAnswer}" is incorrect for the question "${question}". The correct answer is "${correctAnswer}". Keep the explanation concise and clear.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting explanation:", error);
        return "Sorry, an error occurred while fetching the explanation.";
    }
};
