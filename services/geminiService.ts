
// @ts-nocheck
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { Exam, AIPersona } from '../types';

// Initialize the Google GenAI client with the API key from environment variables.
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
        if (start === -1 || end === -1 || end < start) throw new Error("Invalid JSON structure.");
        return JSON.parse(cleaned.substring(start, end + 1));
    } catch (e) {
        throw new Error(`${errorMessage}: Malformed AI output.`);
    }
};

export const getProfessorInteraction = async (content: string, history: any[], message?: string) => {
    const systemInstruction = `
    You are Professor Zein (الأستاذ الدكتور زين), a world-class medical educator known for his charismatic and human-like teaching style.
    
    HUMAN PERSONALITY RULES:
    - Don't sound like a robot or a textbook. Use natural Egyptian academic fillers like: "يا دكاترة", "يا ابني/يا بنتي", "بص بقى يا سيدي", "ركز معايا جداً هنا", "الحتة دي بتيجي في الامتحان كتير".
    - Speak in a warm, encouraging, yet authoritative Egyptian Arabic.
    - Scientific terms MUST stay in English.
    - Be empathetic. If the material is hard, acknowledge it: "أنا عارف إن الحتة دي تقيلة شوية، بس هنبسطها مع بعض".

    TEACHING PROTOCOL:
    - Explain the content section by section.
    - Give Clinical Pearls and Mnemonic tricks.
    - IMPORTANT: Keep segments concise so the audio starts quickly.
    - ALWAYS STOP after a meaningful section and ask: "نكمل ولا في حتة مش واضحة؟"
    `;

    // FIX: Accessing the .text property directly on the response object as per guidelines.
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history, 
            { role: 'user', parts: [{ text: message || "دكتور زين، أنا جاهز نبدأ المحاضرة. اتفضل اشرحلي الملف ده." }] },
            { role: 'user', parts: [{ text: `CONTEXT MATERIAL: ${content.substring(0, 20000)}` }] }
        ],
        config: { 
            systemInstruction,
            temperature: 0.8 // More creative/human-like intonation
        }
    });
    return r.text;
};

export const generateExamFromContent = async (input: any, numNormal: number, numScenario: number, ad: boolean, ex: string[], diff: string) => {
    const prompt = `Task: Academic Examiner. Generate ${numNormal} regular and ${numScenario} scenario MCQs in JSON format based on the provided material. Include 'title' and a 'questions' array. Difficulty: ${diff}.`;
    const parts = [];
    if (input.fileData) parts.push({ inlineData: { data: input.fileData.data, mimeType: input.fileData.mimeType } });
    if (input.text) parts.push({ text: input.text });
    parts.push({ text: prompt });
    // FIX: Using r.text property directly as per GenAI guidelines.
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts }], config: { responseMimeType: "application/json" } });
    return parseJsonOrThrow(r.text, "Generation Error");
};

export const getExplanationForAnswer = async (q: string, ua: string, ca: string) => {
    const systemInstruction = "أنت دكتور زين. اشرح ليه الإجابة صح بالعامية المصرية وبشكل إنساني ودود جداً.";
    // FIX: Using r.text property directly as per GenAI guidelines.
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Q: ${q}, User: ${ua}, Correct: ${ca}`, config: { systemInstruction } });
    return r.text;
};

export const generateSpeech = async (text: string, voice: string = 'Zephyr') => {
    const response = await ai.models.generateContent({ 
        model: "gemini-2.5-flash-preview-tts", 
        contents: [{ parts: [{ text }] }], 
        config: { 
            responseModalities: [Modality.AUDIO], 
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } 
        } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateStudyPlan = async (config: any) => { 
    const prompt = `Generate a JSON study plan for ${config.examName}. Deadline: ${config.examDate}. Topics: ${config.topics.substring(0, 10000)}. Return JSON with fields: targetScore, masterPlan, dailyBlocks, assessments.`;
    try {
        // FIX: Using r.text property directly as per GenAI guidelines.
        const r = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        const parsed = parseJsonOrThrow(r.text, "Study Plan Error");
        return {
            targetScore: parsed.targetScore || "85%",
            masterPlan: parsed.masterPlan || [],
            dailyBlocks: parsed.dailyBlocks || [],
            assessments: parsed.assessments || []
        };
    } catch (e) {
        return { targetScore: "85%", masterPlan: [], dailyBlocks: [], assessments: [] }; 
    }
};

export const getAIResponse = async (history: any[], message: string): Promise<GenerateContentResponse> => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history,
            { role: 'user', parts: [{ text: message }] }
        ],
    });
    return r;
};

// FIX: Added generateStudyAid function to fix the import error in StudyAidsScreen.tsx.
export const generateStudyAid = async (text: string, type: 'summary' | 'flashcards' | 'mind-map') => {
    let prompt = "";
    let responseMimeType: "text/plain" | "application/json" = "text/plain";
    
    if (type === 'summary') {
        prompt = `Create a detailed markdown summary of the following educational material: \n\n${text.substring(0, 20000)}`;
    } else if (type === 'flashcards') {
        prompt = `Extract 10 key concepts from this text and format them as a JSON array of flashcards (objects with "front" and "back" strings): \n\n${text.substring(0, 20000)}`;
        responseMimeType = "application/json";
    } else if (type === 'mind-map') {
        prompt = `Generate a hierarchical mind map structure for this text. Return a JSON object with "topic" (string) and "children" (optional array of similar objects). Text: \n\n${text.substring(0, 20000)}`;
        responseMimeType = "application/json";
    }

    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType }
    });

    if (type === 'summary') {
        return r.text;
    } else {
        return parseJsonOrThrow(r.text, `${type} generation error`);
    }
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getStepByStepExplanation = async (topic: string) => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain this academic topic step-by-step with clear logic: ${topic}`,
    });
    return r.text || "Explanation unavailable.";
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getHighlights = async (text: string) => { 
    const prompt = `Extract top key terms from this text and return as a JSON array of strings: ${text.substring(0, 5000)}`;
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonOrThrow(r.text, "Highlights Error");
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getDailyStudySuggestion = async (context: string) => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this student context (${context}), give a short, actionable study suggestion for today.`,
    });
    return r.text || "Stay focused and keep pushing boundaries.";
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getMotivationalMessage = async () => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Provide a unique and powerful motivational quote for a student working hard today.",
    });
    return r.text || "Your future self will thank you for the work you do today.";
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getSessionSummary = async (minutes: number) => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Celebrate the student for finishing a ${minutes} minute study session with a short, punchy summary of their dedication.`,
    });
    return r.text || "Excellent session! Your focus is paying off.";
};

// FIX: Replaced placeholder with actual Gemini API call.
export const explainDiagram = async (prompt: string, base64: string, mimeType: string) => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [
                { inlineData: { data: base64, mimeType } },
                { text: prompt || "Explain the core concepts and relationships shown in this diagram." }
            ]}
        ]
    });
    return r.text || "I am unable to interpret this diagram right now.";
};

// FIX: Replaced placeholder with actual Gemini API call.
export const categorizeSubjects = async (exams: any[]) => { 
    const titles = exams.map(e => e.title).join(', ');
    const prompt = `Categorize these exam titles into specific academic subjects. Return JSON array of objects with examId and subject. Titles: ${titles}`;
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonOrThrow(r.text, "Categorization Error");
};

// FIX: Replaced placeholder with actual Gemini API call.
export const getMotivationalInsight = async (data: string) => { 
    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this study performance data and provide a personalized, deep motivational insight: ${data}`,
    });
    return r.text || "Progress is a series of small wins. Keep building your momentum.";
};
