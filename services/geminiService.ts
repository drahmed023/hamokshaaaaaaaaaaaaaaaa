
// @ts-nocheck
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exam, AIPersona } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonOrThrow = (text: string, errorMessage: string) => {
    if (!text || typeof text !== 'string') throw new Error("Empty response.");
    let cleaned = text.trim();
    if (cleaned.includes('```')) {
        cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    try {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start !== -1 && end !== -1 && end > start) {
            try {
                return JSON.parse(cleaned.substring(start, end + 1));
            } catch (e) {
                cleaned = cleaned.substring(start);
            }
        } else if (start !== -1) {
            cleaned = cleaned.substring(start);
        } else {
            throw new Error("Missing JSON bounds");
        }

        let fixed = cleaned;
        if ((fixed.match(/"/g) || []).length % 2 !== 0) fixed += '"';
        
        const stack = [];
        for (let i = 0; i < fixed.length; i++) {
            if (fixed[i] === '{' || fixed[i] === '[') stack.push(fixed[i] === '{' ? '}' : ']');
            else if (fixed[i] === '}' || fixed[i] === ']') stack.pop();
        }
        while (stack.length > 0) fixed += stack.pop();
        
        return JSON.parse(fixed);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error(`${errorMessage}: Malformed AI response.`);
    }
};

/**
 * Generates a Hybrid study table in English.
 */
export const generateHybridStudyTable = async (config: { subject: string, topics: string, preferredDays: string[] }) => {
    const prompt = `Organize the following study topics into a professional study table in English.
    
    STRICT RULES:
    1. Language: English only.
    2. USE THESE DAYS ONLY: ${config.preferredDays.join(', ')}.
    3. Group multiple topics into the same day if they fit.
    4. For each topic:
       - Estimate study duration (in minutes).
       - Provide exactly ONE high-quality learning resource (e.g., "YouTube (Relevant Topic)", "Web (Documentation)").
    5. Table columns: Day, Subject, Topic, Duration, Resource.
    
    Subject: ${config.subject}.
    Material Topics: ${config.topics.substring(0, 8000)}`;

    try {
        const r = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planTitle: { type: Type.STRING },
                        rows: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING },
                                    subject: { type: Type.STRING },
                                    topic: { type: Type.STRING },
                                    duration: { type: Type.INTEGER },
                                    resource: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING },
                                            source: { type: Type.STRING }
                                        }
                                    },
                                    status: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return parseJsonOrThrow(r.text, "Hybrid Table Generation Error");
    } catch (err) {
        throw new Error("Failed to generate hybrid study table.");
    }
};

export const generateSimpleStudyTable = async (config: { subject: string, topics: string }) => {
    const prompt = `Create a simple study plan in English based on the provided topics. 
    Language: English. 
    Group topics into Day 1, Day 2, etc. logically.
    Keep original order.
    
    Material content: ${config.topics.substring(0, 8000)}`;

    try {
        const r = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planTitle: { type: Type.STRING },
                        rows: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING },
                                    subject: { type: Type.STRING },
                                    topic: { type: Type.STRING },
                                    status: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return parseJsonOrThrow(r.text, "Table Generation Error");
    } catch (err) {
        throw new Error("Failed to generate study table.");
    }
};

export const generateStudyPlan = async (config: { subject: string, studyDays: string[], hours: string, topics: string }) => {
    const prompt = `Create a comprehensive weekly study plan in English for "${config.subject}".
    Language: English.
    Days available: ${config.studyDays.join(', ')}.
    Hours/day: ${config.hours}.
    Topics: ${config.topics.substring(0, 8000)}.
    
    Structure: Break it down by weeks. For each day, provide a list of specific tasks and resources.`;

    try {
        const r = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        planTitle: { type: Type.STRING },
                        weeks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    weekNumber: { type: Type.INTEGER },
                                    weeklyGoal: { type: Type.STRING },
                                    days: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                dayOfWeek: { type: Type.STRING },
                                                isRestDay: { type: Type.BOOLEAN },
                                                tasks: {
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            task: { type: Type.STRING },
                                                            duration: { type: Type.INTEGER },
                                                            resources: {
                                                                type: Type.ARRAY,
                                                                items: {
                                                                    type: Type.OBJECT,
                                                                    properties: {
                                                                        type: { type: Type.STRING },
                                                                        source: { type: Type.STRING }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        return parseJsonOrThrow(r.text, "Plan Generation Error");
    } catch (err) {
        throw new Error("Failed to generate study plan.");
    }
};

export const generateExamFromContent = async (input: any, n: number, nc: number, ad: boolean, ex: string[], diff: string) => {
    const prompt = `You are an expert academic examiner. Your task is to generate exactly ${n} high-quality Multiple Choice Questions (MCQs) based on the provided material.
    
    IMPORTANT INSTRUCTIONS:
    1. ANALYZE VISUALS: If a PDF or image is provided, look closely at diagrams, charts, and illustrations to create relevant questions.
    2. SCENARIO QUESTIONS: Include ${nc} case-based or clinical scenario questions.
    3. DIFFICULTY: Set the overall level to ${diff}.
    4. LANGUAGE: Generate the exam in the language primarily used in the material (Arabic/English).
    5. UNIQUENESS: Do NOT repeat these existing questions: ${JSON.stringify(ex.slice(-10))}.
    
    Each question must have exactly 4 options and 1 clearly correct answer.`;

    try {
        const parts = [];
        
        // Add multimodal content if available
        if (input.fileData) {
            parts.push({
                inlineData: {
                    data: input.fileData.data,
                    mimeType: input.fileData.mimeType
                }
            });
        }
        
        // Add text content if available
        if (input.text) {
            parts.push({ text: `Content Text: ${input.text.substring(0, 15000)}` });
        }

        // Add the final instruction prompt
        parts.push({ text: prompt });

        const r = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: [{ role: 'user', parts }], 
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
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
                    required: ["questions"]
                }
            } 
        });
        return parseJsonOrThrow(r.text, "Exam Generation Error");
    } catch (err) {
        console.error("Exam Gen Error:", err);
        throw new Error("Failed to generate exam. Please ensure the file is readable.");
    }
};

export const getProfessorInteraction = async (fileContent: string, history: any[], userVoiceInput?: string) => {
    const prompt = history.length === 0 
        ? `Explain briefly as Dr. Zayn: ${fileContent.substring(0, 3000)}` 
        : `Student: "${userVoiceInput}". Reply briefly in Egyptian Arabic.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: "You are Dr. Zayn. Use Egyptian Arabic. Max 2 sentences." }
        });
        return response.text || "تمام.";
    } catch (err) { return "Voice issue."; }
};

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
    if (!text) return null;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text.substring(0, 500) }] }],
            config: {
                responseModalalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) { return null; }
};

export const generateStudyAid = async (t: string, type: string) => {
    const isSummary = type === 'summary';
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Create ${type} for: ${t.substring(0, 5000)}`,
        config: { responseMimeType: isSummary ? 'text/plain' : 'application/json' }
    });
    return isSummary ? r.text : parseJsonOrThrow(r.text, "Aid Error");
};

export const getExplanationForAnswer = async (q: string, ua: string, ca: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Why is "${ca}" correct for: "${q}"?`,
        config: { maxOutputTokens: 500 }
    });
    return r.text;
};

export const getAIResponse = async (h: any[], m: string, p: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [...h, {role:'user', parts:[{text:m}]}] });
    return { text: r.text, functionCalls: r.functionCalls };
};

export const getStepByStepExplanation = async (t: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `3 steps: ${t}` });
    return r.text;
};

export const getHighlights = async (t: string) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `5 terms JSON: ${t.substring(0, 4000)}`, config: { responseMimeType: 'application/json' } });
    return parseJsonOrThrow(r.text, "Error");
};

export const getDailyStudySuggestion = async (c: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Status: ${c}. You are a simple study coach. Give exactly ONE brief, encouraging tip or reminder (max 15 words). No headings, no bold, just plain text.` 
    });
    return r.text;
};

export const getMotivationalMessage = async () => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Short quote` });
    return r.text;
};

export const getSessionSummary = async (m: number, s: number) => {
    const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Summary: ${m}m.` });
    return r.text;
};

export const explainDiagram = async (p: string, b: string, m: string) => {
    const r = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: { parts: [{ inlineData: { data: b, mimeType: m } }, { text: p }] }
    });
    return r.text;
};

export const categorizeSubjects = async (exams: Exam[]) => {
    const prompt = `Categorize: ${JSON.stringify(exams.map(e => ({ id: e.id, title: e.title })))}`;
    try {
        const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
        return parseJsonOrThrow(r.text, "Error");
    } catch (err) { return exams.map(e => ({ examId: e.id, subject: 'General' })); }
};

export const getMotivationalInsight = async (dataString: string) => {
    try {
        const r = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts: [{ text: `Motivate: ${dataString}` }] }] });
        return r.text || "Keep it up!";
    } catch (err) { return "Great job!"; }
};
