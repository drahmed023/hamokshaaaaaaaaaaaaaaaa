
// @ts-nocheck
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
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
        if (start === -1 || end === -1 || end < start) throw new Error("Invalid JSON structure.");
        return JSON.parse(cleaned.substring(start, end + 1));
    } catch (e) {
        throw new Error(`${errorMessage}: Malformed AI output.`);
    }
};

export const getProfessorInteraction = async (content: string, history: any[], message?: string) => {
    const systemInstruction = `
    أنت الآن "الأستاذ الدكتور زين"، بروفيسور حقيقي، كاريزماتيك، وودود جداً.
    
    قواعد الشخصية البشرية:
    - لا تتحدث كآلة. استخدم لزمات الأساتذة المصريين: "يا دكاترة"، "ركز يا ابني في دي"، "بص بقى يا سيدي"، "دي حتة امتحانات".
    - كلامك لازم يكون "بشري"؛ لو المعلومة صعبة قول: "أنا عارف إن دي بتلخبط، بس ركز معايا ثانية".
    - العلم والطلحات الطبية بالإنجليزية، لكن الشرح بالعامية المصرية المثقفة.
    - اجعل إجاباتك مركزة وقصيرة (فقرة واحدة) لكي يبدأ الصوت بسرعة ولا يمل الطالب.
    - في نهاية كل شرح، اسأل الطالب: "ها.. الحتة دي واضحة ولا أعيدها بشكل تاني؟".
    `;

    const r = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history, 
            { role: 'user', parts: [{ text: message || "دكتور زين، أنا جاهز نبدأ. اشرحلي الملف ده كأننا قاعدين مع بعض في المكتب." }] },
            { role: 'user', parts: [{ text: `CONTEXT MATERIAL: ${content.substring(0, 15000)}` }] }
        ],
        config: { 
            systemInstruction,
            temperature: 0.9 
        }
    });
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

export const generateExamFromContent = async (input: any, numNormal: number, numScenario: number, ad: boolean, ex: string[], diff: string) => {
    const prompt = `Task: Academic Examiner. Generate ${numNormal} regular and ${numScenario} scenario MCQs in JSON format.`;
    const parts = [];
    if (input.fileData) parts.push({ inlineData: { data: input.fileData.data, mimeType: input.fileData.mimeType } });
    if (input.text) parts.push({ text: input.text });
    parts.push({ text: prompt });
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts }], config: { responseMimeType: "application/json" } });
    return parseJsonOrThrow(r.text, "Generation Error");
};

export const getExplanationForAnswer = async (q: string, ua: string, ca: string) => {
    const systemInstruction = "أنت دكتور زين. اشرح ليه الإجابة صح بالعامية المصرية وبشكل إنساني ودود جداً.";
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Q: ${q}, User: ${ua}, Correct: ${ca}`, config: { systemInstruction } });
    return r.text;
};

export const generateStudyPlan = async (config: any) => { 
    const prompt = `Generate study plan JSON...`;
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    return parseJsonOrThrow(r.text, "Error");
};

export const getAIResponse = async (h: any[], m: string) => { 
    return await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [...h, { role: 'user', parts: [{ text: m }] }] });
};

export const generateStudyAid = async (t: string, ty: string) => { return "Content"; };
export const getStepByStepExplanation = async (t: string) => { return "Explanation"; };
export const getHighlights = async (t: string) => { return ["key"]; };
export const getDailyStudySuggestion = async (c: string) => { return "Tip"; };
export const getMotivationalMessage = async () => { return "Go!"; };
export const getSessionSummary = async (m: number) => { return "Summary"; };
export const explainDiagram = async (p: string, b: string, m: string) => { return "Diagram"; };
export const categorizeSubjects = async (e: any[]) => { return []; };
export const getMotivationalInsight = async (d: string) => { return "Insight"; };
