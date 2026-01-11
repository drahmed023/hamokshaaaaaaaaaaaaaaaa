
// @ts-nocheck
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exam, AIPersona } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonOrThrow = (text: string, errorMessage: string) => {
    if (!text || typeof text !== 'string') throw new Error("Empty AI response.");
    
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    try {
        const startObj = cleaned.indexOf('{');
        const startArr = cleaned.indexOf('[');
        const start = (startObj !== -1 && startArr !== -1) ? Math.min(startObj, startArr) : (startObj !== -1 ? startObj : startArr);
        const endObj = cleaned.lastIndexOf('}');
        const endArr = cleaned.lastIndexOf(']');
        const end = Math.max(endObj, endArr);

        if (start === -1 || end === -1 || end < start) {
            throw new Error("Could not find valid JSON structure in AI response.");
        }
        const jsonString = cleaned.substring(start, end + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error. Original text snippet:", text.substring(0, 500));
        throw new Error(`${errorMessage}: Malformed AI output. Please try a more specific command.`);
    }
};

export const generateStudyPlan = async (config: {
    examName: string;
    examDate: string;
    startDate: string;
    studyDays: string[];
    dailyHours: number;
    intensity: string;
    topics: string;
}) => {
    const prompt = `Task: Create a high-yield study mission for: "${config.examName}".
    Start Date: ${config.startDate}. Exam Date: ${config.examDate}.
    Available Study Days Each Week: ${config.studyDays.join(', ')}.
    Daily Commitment: ${config.dailyHours}h. Intensity: ${config.intensity}.
    Material Context: ${config.topics.substring(0, 4000)}.
    
    JSON STRUCTURE:
    {
      "masterPlan": [{"week": 1, "day": "DayName", "date": "YYYY-MM-DD", "topic": "...", "yield": "High", "tips": "...", "youtubeSearch": "..."}],
      "dailyBlocks": [{"date": "YYYY-MM-DD", "from": "09:00", "to": "11:00", "topic": "...", "method": "...", "tips": "...", "youtubeSearch": "..."}],
      "assessments": [{"date": "YYYY-MM-DD", "type": "Quiz", "topicsCovered": "...", "goal": "..."}]
    }`;

    try {
        const r = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are an Elite Academic Strategist. Create plans that strictly follow user days. Use English for all responses.",
                responseMimeType: "application/json"
            }
        });
        return parseJsonOrThrow(r.text, "Strategist Error");
    } catch (err) {
        throw new Error("Failed to deploy strategy: " + err.message);
    }
};

export const generateExamFromContent = async (input: any, n: number, nc: number, ad: boolean, ex: string[], diff: string) => {
    const prompt = `Generate ${n} MCQs for ${diff} difficulty. Include ${nc} clinical scenarios. Use English.
    Format as JSON: { "title": "Exam Title", "questions": [ { "questionText": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" } ] }`;
    const parts = [];
    if (input.fileData) parts.push({ inlineData: { data: input.fileData.data, mimeType: input.fileData.mimeType } });
    if (input.text) parts.push({ text: input.text });
    parts.push({ text: prompt });
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts }], config: { responseMimeType: "application/json" } });
    return parseJsonOrThrow(r.text, "Exam Generation Error");
};

export const generateStudyAid = async (text: string, type: 'summary' | 'flashcards' | 'mind-map') => {
    let prompt = "";
    let systemInstruction = "";
    let responseMimeType = "text/plain";
    if (type === 'summary') {
        prompt = `Summarize clearly in English: ${text.substring(0, 10000)}`;
        systemInstruction = "Summarize as an academic assistant.";
    } else if (type === 'flashcards') {
        prompt = `Generate 10 flashcards in English as JSON: [{"front": "...", "back": "..."}]. Text: ${text.substring(0, 8000)}`;
        systemInstruction = "Active recall expert.";
        responseMimeType = "application/json";
    } else if (type === 'mind-map') {
        prompt = `Hierarchy JSON in English: {"topic": "...", "children": [...]}. Text: ${text.substring(0, 8000)}`;
        systemInstruction = "Strategic visualization expert.";
        responseMimeType = "application/json";
    }
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { systemInstruction, responseMimeType: responseMimeType as any } });
    if (type === 'summary') return r.text;
    return parseJsonOrThrow(r.text, "Study Aid Error");
};

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.substring(0, 500) }] }],
        config: {
            responseModalalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const getExplanationForAnswer = async (q: string, ua: string, ca: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Question: "${q}". 
Selected Answer: "${ua}". 
Correct Answer: "${ca}". 
Explain as Dr. Zayn (Professor persona) why the correct answer is the most appropriate and why the other choice might be incorrect. Make the explanation academic, deep, and encouraging in English.`,
        config: { systemInstruction: "You are Dr. Zayn, a world-class academic mentor. Your explanations are clear, encouraging, and highly educational in English." }
    });
    return r.text;
};

export const getAIResponse = async (h: any[], m: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: [...h, {role:'user', parts:[{text:m}]}],
        config: {
            systemInstruction: "You are a helpful AI study assistant named Dr. Zayn. Respond in English only.",
            tools: [{
                functionDeclarations: [
                    { name: 'navigateTo', description: 'Navigate user to page (home, history, planner, settings, profile, study-aids).', parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING } }, required: ['page'] } },
                    { name: 'scheduleTask', description: 'Schedule task.', parameters: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, dueDate: { type: Type.STRING } }, required: ['description'] } }
                ]
            }]
        }
    });
    return { text: r.text, functionCalls: r.functionCalls };
};

export const getStepByStepExplanation = async (t: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Break down this topic step-by-step in English: ${t}` });
    return r.text;
};

export const getHighlights = async (t: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Extract 5 high-yield keywords as JSON array in English: ${t.substring(0, 1000)}`, config: { responseMimeType: 'application/json' } });
    return parseJsonOrThrow(r.text, "Highlights Error");
};

export const getDailyStudySuggestion = async (c: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Based on the student's status: "${c}". Provide one tactical study advice as Dr. Zayn in English. Keep it inspiring and short.`,
        config: { systemInstruction: "You are Dr. Zayn, a world-class academic coach." }
    });
    return r.text;
};

export const getMotivationalMessage = async () => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: "Give 1 elite short motivational quote in English." });
    return r.text;
};

export const getSessionSummary = async (m: number) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Summarize impact of ${m} mins deep focus in English.` });
    return r.text;
};

export const explainDiagram = async (p: string, b: string, m: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [{ inlineData: { data: b, mimeType: m } }, { text: p + " Respond in English." }] } });
    return r.text;
};

export const categorizeSubjects = async (exams: Exam[]) => { return exams.map(e => ({ examId: e.id, subject: 'Study' })); };
export const getMotivationalInsight = async (data: string) => { return "Keep going, you are building your future!"; };

// FIX: Added getProfessorInteraction to support the interactive voice session in ProfessorScreen.
export const getProfessorInteraction = async (content: string, history: any[], message?: string) => {
    const prompt = message || "I have uploaded my lecture notes. Please introduce yourself briefly and summarize the main topics in these notes so we can start our discussion.";
    
    // Inject context only if it's the first turn or if we want to ensure context remains fresh.
    const contextPart = history.length === 0 ? `STUDY MATERIAL CONTEXT: ${content.substring(0, 15000)}\n\n` : "";
    
    const userMessage = {
        role: 'user',
        parts: [{ text: `${contextPart}STUDENT SAYS: ${prompt}` }]
    };

    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: [...history, userMessage],
        config: {
            systemInstruction: "You are Dr. Zayn, a brilliant and kind professor. You are conducting an oral exam or discussion session with a student based on their uploaded material. Your tone is academic, encouraging, and clear. Keep your responses relatively concise for voice-based interaction. Always respond in Arabic as per the interface language.",
        }
    });
    return r.text;
};
