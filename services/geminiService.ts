// @ts-nocheck
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Exam, MindMapNodeData, Question, StudyPlan, StudyWeek, StudyDay, StudyTask, AIPersona, StudyResource } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

const getSystemInstructionForPersona = (persona: AIPersona): string => {
    switch (persona) {
        case 'formal': return "You are a formal, academic assistant. Be precise and use professional language.";
        case 'motivational': return "You are an upbeat, motivational coach. Encourage the user and be positive.";
        case 'academic': return "You are a knowledgeable professor. Provide detailed, structured, and insightful information.";
        case 'friendly':
        default:
            return "You are a friendly and helpful study companion.";
    }
};

// Helper function to handle potential JSON parsing errors
const parseJsonOrThrow = (jsonString: string, errorMessage: string) => {
    if (!jsonString || jsonString.trim() === '') {
        console.error(errorMessage, "Received empty string.");
        throw new Error(errorMessage);
    }
    try {
        // The Gemini API might return the JSON wrapped in markdown backticks.
        const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
        return JSON.parse(cleanedJsonString);
    } catch (e) {
        console.error(errorMessage, e);
        console.error("Received string:", jsonString);
        throw new Error(errorMessage);
    }
};

export const generateExamFromContent = async (
    input: { text?: string; fileData?: { base64: string; mimeType: string } },
    numQuestions: number,
    numCaseQuestions: number,
    adaptive: boolean,
    existingQuestions?: string[]
): Promise<Omit<Exam, 'id' | 'sourceFileName'>> => {
    const numGeneralQuestions = numQuestions - numCaseQuestions;
    
    let prompt = `Create a multiple-choice exam with a total of ${numQuestions} questions based on the provided content. 
Each question must have exactly 4 options, and one must be the correct answer.

The question mix should be as follows:
- Exactly ${numCaseQuestions} case-based or scenario questions that require critical thinking to solve.
- Exactly ${numGeneralQuestions} general knowledge questions of varying difficulty.

Analyze the content thoroughly. If the content contains images, diagrams, or charts, generate questions that test the understanding of these visual elements where appropriate.

${adaptive ? 'The questions should be suitable for a beginner or someone new to this topic.' : ''} 

The output must be a JSON object with a "title" (string) and a "questions" (array of objects) property. Each question object must have "questionText" (string), "options" (array of 4 strings), and "correctAnswer" (string, which is one of the options).
`;

    if (existingQuestions && existingQuestions.length > 0) {
        prompt += `\n\nCRITICAL INSTRUCTION: Avoid generating questions that are identical or very similar to the following list of already-used questions to ensure variety:\n- ${existingQuestions.join('\n- ')}`;
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionText: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING }
                    },
                    required: ["questionText", "options", "correctAnswer"]
                }
            }
        },
        required: ["title", "questions"]
    };

    let contents = [];
    
    if (input.fileData) {
        // Multimodal request (File + Text Prompt)
        contents = [{
            role: 'user',
            parts: [
                { inlineData: { mimeType: input.fileData.mimeType, data: input.fileData.base64 } },
                { text: prompt }
            ]
        }];
    } else if (input.text) {
        // Text-only request
        contents = [{
            role: 'user',
            parts: [{ text: `${prompt}\n\nContent:\n---\n${input.text}\n---` }]
        }];
    } else {
        throw new Error("No content provided for exam generation.");
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Upgraded model to handle larger output and multimodal inputs.
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    return parseJsonOrThrow(response.text, "Failed to generate a valid exam. The AI's response was not in the expected JSON format.");
};

export const getExplanationForAnswer = async (questionText: string, userAnswer: string, correctAnswer: string): Promise<string> => {
    const prompt = `A user answered a multiple-choice question incorrectly.
Question: "${questionText}"
Their answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

Explain briefly why the user's answer is incorrect and why the correct answer is correct. Be concise and helpful.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateStudyAid = async (text: string, aidType: 'summary' | 'flashcards' | 'mind-map'): Promise<any> => {
    let prompt: string;
    let responseSchema: any;

    switch (aidType) {
        case 'summary':
            prompt = `Summarize the following text concisely. Focus on the key points and main ideas.

Text:
---
${text}
---`;
            const summaryResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            return summaryResponse.text;

        case 'flashcards':
            prompt = `Based on the following text, create a set of flashcards. The output must be a JSON array of objects, where each object has a "front" (string for the question/term) and a "back" (string for the answer/definition).

Text:
---
${text}
---`;
            responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING },
                        back: { type: Type.STRING }
                    },
                    required: ["front", "back"]
                }
            };
            const flashcardsResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema }
            });
            return parseJsonOrThrow(flashcardsResponse.text, "Failed to generate valid flashcards.");

        case 'mind-map':
            prompt = `Create a mind map structure from the following text. The output must be a JSON object representing the root node. The root node should have a "topic" (string) and an optional "children" (array of node objects) property. Each child node has the same structure. Go about 3 levels deep. Assign a unique "id" (string) to every single node.

Text:
---
${text}
---`;
            // Schema definition with recursive structure for children is complex in pure JSON schema for Gemini directly sometimes, 
            // but we can define the base object.
            // Simplified schema to ensure we get the ID.
            const mindMapResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" } // Relaxed schema for recursive structure
            });
            return parseJsonOrThrow(mindMapResponse.text, "Failed to generate a valid mind map.");
            
        default:
            throw new Error('Invalid study aid type');
    }
};

export const getHighlights = async (text: string): Promise<string[]> => {
    const prompt = `From the following text, extract the 5 most important key phrases or sentences. The output must be a JSON array of strings.

Text:
---
${text}
---`;
    const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema }
    });
    return parseJsonOrThrow(response.text, "Failed to generate highlights.");
};

export const generateStudyPlan = async (data: any): Promise<Omit<StudyPlan, 'id' | 'createdAt'>> => {
    let contentPrompt: string;
    if (data.inputMode === 'upload' && data.fileContent) {
        contentPrompt = `The study material is from an uploaded document:\n---\n${data.fileContent}\n---`;
    } else if (data.inputMode === 'list' && data.topics) {
        contentPrompt = `The student has provided a list of topics/lectures:\n---\n${data.topics}\n---`;
    } else {
        contentPrompt = `The student is studying "${data.subject}" with the goal to "${data.goal}".`;
    }
    
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Create a detailed, structured study plan for a student.
- Today's Date: ${today}
- Final Exam Date: ${data.examDate}
- Available Study Days: ${data.studyDays.join(', ')}
- Daily Commitment: Approximately ${data.hours} hours per day on available days.
- Instruction: When assigning durations, intelligently allocate more time to complex or foundational topics and less time to simpler ones. The total duration for each day should approximate the student's daily commitment.
- Study Material/Goal: ${contentPrompt}
${data.includeReviews ? '- Instruction: The plan must include dedicated review sessions for previously covered topics, especially leading up to the exam date.' : ''}

- For each task, include an optional "resources" array. This is a critical step. Use your web search tool to find resources.
- For video resources from YouTube, instead of providing a "url", provide a concise and effective "searchQuery" string that the student can use to find the best videos on YouTube for that topic. For all other resource types (article, pdf), continue to provide a direct "url".
- Each resource object must have a "type" ('video', 'article', 'pdf'), a "title", and a "source" (e.g., 'YouTube', 'Amboss', 'Osmosis', 'Lecturio', 'Khan Academy', 'PubMed'). When generating resources, prioritize these sources but you can also use others if they are high-quality.
- Do NOT invent URLs. If you cannot find a suitable, high-quality resource, leave the resources array empty for that task.

The output MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks or explain the code.
The JSON object must have "planTitle" (string) and "weeks" (array of week objects).
The plan should start from today and intelligently distribute the topics across the available study days, ending before the exam date.
Each week object must have "weekNumber" (number), "weeklyGoal" (string), and "days" (array of day objects for the ENTIRE week, Monday-Sunday).
For days the student is NOT available, mark them as "isRestDay": true with an empty tasks array.
Each day object must have "dayOfWeek" (string e.g., "Monday"), "tasks" (array of task objects), and "isRestDay" (boolean).
Each task object must have "task" (string), "duration" (number in minutes), "priority" ('High', 'Medium', or 'Low').
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using flash for complex generation to save quota
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const planData = parseJsonOrThrow(response.text, "Failed to generate a valid study plan.");
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return { ...planData, groundingMetadata };
};

export const getStepByStepExplanation = async (topic: string): Promise<string> => {
    const prompt = `Explain the following topic in a clear, well-structured manner, as if you were teaching a beginner.
Use markdown for formatting. You can use:
- Headings (e.g., # Title, ## Subtitle)
- Bold (**bold**) and italic (*italic*) text.
- Unordered lists (e.g., - item) and ordered lists (e.g., 1. item).
- Tables for structured data.
- Blockquotes (e.g., > note) for important notes or tips.
- Code blocks (e.g., \`\`\`code\`\`\`) for code examples.

Topic:
---
${topic}
---`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const getDailyStudySuggestion = async (context: string): Promise<string> => {
    const prompt = `Based on the following student context, provide a single, actionable study suggestion for today. Be encouraging and specific.

Context:
---
${context}
---

Suggestion:`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};

export const categorizeSubjects = async (exams: Omit<Exam, 'questions'>[]): Promise<{ examId: string, subject: string }[]> => {
    const examTitles = exams.map(e => ({ id: e.id, title: e.title, fileName: e.sourceFileName }));
    const prompt = `Categorize the following exams into general subjects (e.g., "History", "Biology", "Programming", "Literature"). The output must be a JSON array of objects, each with "examId" and "subject".

Exams:
---
${JSON.stringify(examTitles)}
---`;
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                examId: { type: Type.STRING },
                subject: { type: Type.STRING }
            },
            required: ["examId", "subject"]
        }
    };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema }
    });
    return parseJsonOrThrow(response.text, "Failed to categorize subjects.");
};

export const getMotivationalInsight = async (data: string): Promise<string> => {
    const prompt = `Analyze the following student performance data (last 10 results). Provide a short, motivational insight based on their trends or recent scores. Address the student directly.

Data:
---
${data}
---`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};

export const getMotivationalMessage = async (): Promise<string> => {
    const prompt = `Provide a very short, upbeat, and motivational quote for a student suitable for displaying on a study dashboard. Make it encouraging and concise (around 10-15 words).`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};

export const getSessionSummary = async (totalMinutes: number, sessionsToday: number): Promise<string> => {
    const prompt = `A student just finished a Pomodoro study session.
- Total focus time today: ${totalMinutes} minutes
- Number of sessions completed today: ${sessionsToday}

Provide a short, positive, and analytical summary of their effort. Mention the duration and consistency. Keep it to one or two sentences.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};

// --- AI Companion Tools ---
const pages = ["home", "create exam", "history", "analytics", "achievements", "study aids", "study plan", "saved items", "explainer", "tasks", "calendar", "settings", "drive", "notion", "diagram explainer"];
const pagePaths: Record<string, string> = {
    "home": "/", "create exam": "/create-exam", "history": "/history", "analytics": "/analytics",
    "achievements": "/achievements", "study aids": "/study-aids", "study plan": "/study-plan",
    "saved items": "/saved-items", "explainer": "/explainer", "tasks": "/tasks", "calendar": "/calendar",
    "settings": "/settings", "drive": "/drive", "notion": "/notion", "diagram explainer": "/diagram-explainer"
};

export const navigateToFunctionDeclaration: FunctionDeclaration = {
    name: 'navigateTo',
    description: 'Navigates to a specific page within the application.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            page: {
                type: Type.STRING,
                description: `The destination page. Must be one of: ${pages.join(', ')}`,
            },
        },
        required: ['page'],
    },
};

export const scheduleTaskFunctionDeclaration: FunctionDeclaration = {
    name: 'scheduleTask',
    description: 'Schedules a new task for the user.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            description: {
                type: Type.STRING,
                description: 'A description of the task to be scheduled.',
            },
            dueDate: {
                type: Type.STRING,
                description: 'The due date for the task in YYYY-MM-DD format. If not provided, ask the user for a date.',
            },
        },
        required: ['description'],
    },
};
// --- End AI Companion Tools ---

export const getAIResponse = async (
    messageHistory: { role: 'user' | 'model', parts: { text: string }[] }[],
    newMessage: string,
    persona: AIPersona,
): Promise<{ text: string, functionCalls?: any[] }> => {
    const contents = [...messageHistory, { role: 'user' as const, parts: [{ text: newMessage }] }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: {
            systemInstruction: getSystemInstructionForPersona(persona),
            tools: [{ functionDeclarations: [navigateToFunctionDeclaration, scheduleTaskFunctionDeclaration] }],
        }
    });
    
    return { text: response.text, functionCalls: response.functionCalls };
};

export const explainDiagram = async (prompt: string, imageBase64: string, imageMimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
    // Truncate overly long text for speech generation to avoid timeout or quota issues
    const safeText = text.length > 500 ? text.substring(0, 500) + "..." : text;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this naturally: ${safeText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio from the API.");
    }
    return base64Audio;
}