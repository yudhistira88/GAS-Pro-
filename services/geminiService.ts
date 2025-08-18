
import { GoogleGenAI, Type } from "@google/genai";
import { type RabItem, type AhsComponent, type RabDetailItem } from '../types';

// The API key is sourced from the environment variable `process.env.API_KEY`.
// It is assumed to be set in the deployment environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a Rencana Anggaran Biaya (RAB) using the Gemini API.
 * @param projectDescription A description of the project.
 * @returns A promise that resolves to an array of RAB items.
 */
export async function generateRAB(projectDescription: string): Promise<RabItem[]> {
    const systemInstruction = `Anda adalah asisten ahli estimasi biaya konstruksi di Indonesia. Tugas Anda adalah membuat Rencana Anggaran Biaya (RAB) berdasarkan deskripsi proyek yang diberikan.
Gunakan harga material dan upah kerja yang wajar untuk wilayah Jabodetabek, Indonesia.
Keluarkan output HANYA dalam format JSON array yang valid. Jangan membungkusnya dalam markdown (seperti \`\`\`json).
Skema untuk setiap objek dalam array harus: { "item": string, "quantity": number, "unit": string, "unit_price": number, "total_price": number }.
Semua harga harus dalam Rupiah (IDR). Jangan pernah menyertakan pemisah ribuan atau simbol mata uang dalam nilai angka.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Buatkan RAB dalam format JSON untuk proyek berikut: ${projectDescription}`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2, // Lower temperature for more predictable JSON output
            },
        });

        const jsonText = response.text
            .trim()
            .replace(/^```json\n?/, '')
            .replace(/\n?```$/, '');
            
        const rabData = JSON.parse(jsonText);

        if (!Array.isArray(rabData)) {
            throw new Error("Invalid format: Gemini API did not return an array.");
        }
        
        return rabData.filter(item => 
            typeof item.item === 'string' &&
            typeof item.quantity === 'number' &&
            typeof item.unit === 'string' &&
            typeof item.unit_price === 'number' &&
            typeof item.total_price === 'number'
        );

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate RAB from Gemini API.");
    }
}


/**
 * Generates estimated unit prices and AHS breakdown for a list of RAB items using the Gemini API.
 * @param items An array of work item descriptions.
 * @returns A promise that resolves to an array of objects, each with a price and AHS breakdown.
 */
export async function generatePricesAndAhsForRAB(items: string[]): Promise<{ price: number; ahs: AhsComponent[] }[]> {
    const systemInstruction = `Anda adalah AI estimasi biaya konstruksi. Diberikan array JSON berisi deskripsi pekerjaan, buatlah Analisa Harga Satuan (AHS) dan harga satuan total untuk setiap item di wilayah Jabodetabek, Indonesia.
Keluarkan output HANYA dalam format objek JSON tunggal yang valid dengan skema yang telah ditentukan.
Jumlah elemen dalam array "results" harus sama persis dengan jumlah deskripsi pekerjaan yang diberikan.
Harga total ("price") adalah jumlah dari (quantity * unitPrice) dari semua komponen di dalam AHS.
Setiap komponen dalam AHS harus memiliki kategori ('Material', 'Jasa Pekerja', atau 'Alat Bantu', atau kategori spesifik lainnya jika relevan).
Jangan sertakan pemisah ribuan atau simbol mata uang. Jika suatu item tidak dapat diperkirakan, gunakan harga 0 dan AHS kosong.`;

    const prompt = `Buatkan Analisa Harga Satuan (AHS) dan harga satuan total untuk daftar pekerjaan berikut:\n${JSON.stringify(items)}`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            results: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        price: { type: Type.NUMBER, description: "Total harga satuan dari AHS." },
                        ahs: {
                            type: Type.ARRAY,
                            description: "Komponen Analisa Harga Satuan.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    componentName: { type: Type.STRING, description: "Nama material atau tenaga kerja." },
                                    quantity: { type: Type.NUMBER, description: "Jumlah yang dibutuhkan." },
                                    unit: { type: Type.STRING, description: "Satuan komponen (e.g., m3, sak, HOK)." },
                                    unitPrice: { type: Type.NUMBER, description: "Harga satuan per komponen." },
                                    category: { type: Type.STRING, description: "Kategori komponen: 'Material', 'Jasa Pekerja', atau 'Alat Bantu'." }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Array.isArray(result.results) && result.results.length === items.length) {
            return result.results.map((r: any) => ({
                price: Number(r.price) || 0,
                ahs: Array.isArray(r.ahs) ? r.ahs.map((a: any, i: number) => ({
                    id: `ahs-gen-${Date.now()}-${i}`,
                    componentName: String(a.componentName || ''),
                    quantity: Number(a.quantity) || 0,
                    unit: String(a.unit || ''),
                    unitPrice: Number(a.unitPrice) || 0,
                    category: a.category || 'Lainnya',
                    source: 'ai'
                })) : [],
            }));
        } else {
            console.error("Mismatched response from Gemini:", result);
            throw new Error("Invalid format or length mismatch from Gemini API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for AHS generation:", error);
        throw new Error("Failed to generate prices and AHS from Gemini API.");
    }
}

/**
 * Generates an estimated price, unit, and category for a single construction component.
 * @param componentName The name of the component (e.g., "Semen Portland").
 * @returns A promise that resolves to an object with price, unit, and category.
 */
export async function generateSingleItemPrice(componentName: string): Promise<{ unitPrice: number; unit: string; category: string }> {
    const systemInstruction = `You are a construction cost estimator AI for Indonesia. Given a component name, provide its estimated unit price in IDR, its standard unit, and its category (e.g., 'Material', 'Jasa Pekerja', 'Alat Bantu') for the Jabodetabek region.
    Respond ONLY in a valid JSON object format. Do not use markdown.
    If you cannot determine the price or category, return zero for the price and default values.`;
    
    const prompt = `Provide cost estimation for: "${componentName}"`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            unitPrice: { type: Type.NUMBER, description: "Estimated price per unit in IDR. No currency symbols or thousands separators." },
            unit: { type: Type.STRING, description: "The standard unit of measurement (e.g., sak, m3, btg, HOK)." },
            category: { type: Type.STRING, description: "The component category." }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        const category = result.category || 'Material';

        return {
            unitPrice: Number(result.unitPrice) || 0,
            unit: String(result.unit || ''),
            category: category,
        };

    } catch (error) {
        console.error("Error calling Gemini API for single item price:", error);
        throw new Error("Failed to generate single item price from Gemini API.");
    }
}

/**
 * Generates an Analisa Harga Satuan (AHS) for a single work item using the Gemini API.
 * @param workItemName The name of the work item (e.g., "Pekerjaan Dinding Bata Merah").
 * @returns A promise that resolves to an array of AHS components.
 */
export async function generateAhsForSingleItem(workItemName: string): Promise<AhsComponent[]> {
    const systemInstruction = `Anda adalah AI estimasi biaya konstruksi ahli untuk wilayah Jabodetabek, Indonesia.
    Tugas Anda adalah membuat Analisa Harga Satuan (AHS) untuk satu jenis pekerjaan konstruksi yang diberikan.
    Fokus pada komponen utama: Material, Jasa Pekerja, dan Alat Bantu.
    Gunakan harga yang wajar dan umum. Kuantitas harus sesuai untuk menyelesaikan 1 satuan dari pekerjaan tersebut (misal, 1 m2, 1 m3, dsb.).
    Keluarkan output HANYA dalam format array JSON yang valid. Jangan bungkus dalam markdown.
    Jika Anda tidak dapat membuat AHS, kembalikan array kosong [].`;

    const prompt = `Buatkan Analisa Harga Satuan (AHS) untuk pekerjaan berikut: "${workItemName}"`;
    
    const responseSchema = {
        type: Type.ARRAY,
        description: "Komponen Analisa Harga Satuan.",
        items: {
            type: Type.OBJECT,
            properties: {
                componentName: { type: Type.STRING, description: "Nama material atau tenaga kerja." },
                quantity: { type: Type.NUMBER, description: "Jumlah yang dibutuhkan." },
                unit: { type: Type.STRING, description: "Satuan komponen (e.g., m3, sak, HOK)." },
                unitPrice: { type: Type.NUMBER, description: "Harga satuan per komponen dalam IDR." },
                category: { type: Type.STRING, description: "Kategori: 'Material', 'Jasa Pekerja', atau 'Alat Bantu'." }
            },
            required: ["componentName", "quantity", "unit", "unitPrice", "category"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.4,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (Array.isArray(result)) {
            return result.map((a: any, i: number) => ({
                id: `ahs-gen-${Date.now()}-${i}`,
                componentName: String(a.componentName || ''),
                quantity: Number(a.quantity) || 0,
                unit: String(a.unit || ''),
                unitPrice: Number(a.unitPrice) || 0,
                category: a.category || 'Lainnya',
                source: 'ai' as const
            }));
        } else {
            console.error("Mismatched response from Gemini:", result);
            throw new Error("Invalid format from Gemini API, expected an array.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for single AHS generation:", error);
        throw new Error("Failed to generate AHS from Gemini API.");
    }
}


// --- NEW BQ GENERATION FLOW ---

export interface BqPromptDetails {
    projectTitle: string;
    duration: number;
    location: string;
    workerType: 'Sertifikasi' | 'Non Sertifikasi';
}

export interface DynamicQuestion {
  key: string;
  question: string;
  type: 'text' | 'number';
}

/**
 * Step 1: Generate clarifying questions based on initial project details.
 * @param promptDetails Initial details of the project.
 * @returns A promise resolving to an array of questions for the user.
 */
export async function generateBqQuestions(promptDetails: BqPromptDetails): Promise<DynamicQuestion[]> {
    const systemInstruction = `Anda adalah seorang Quantity Surveyor (QS) ahli. Berdasarkan detail awal sebuah proyek konstruksi, tugas Anda adalah membuat daftar pertanyaan lanjutan yang relevan untuk memperjelas ruang lingkup pekerjaan dan membuat Bill of Quantity (BQ) yang akurat.
    - Ajukan 3-5 pertanyaan paling penting.
    - Pertanyaan harus singkat dan jelas.
    - Berikan 'key' unik untuk setiap pertanyaan (snake_case).
    - Tentukan 'type' input yang diharapkan ('text' atau 'number').
    - Keluarkan output HANYA dalam format array JSON yang valid. Jangan ada penjelasan atau markdown.
    Contoh: Jika judul proyek "Pembangunan Rumah Tinggal 2 Lantai", pertanyaan bisa tentang luas bangunan, jumlah kamar mandi, atau material atap.`;

    const prompt = `Buatkan pertanyaan lanjutan untuk proyek berikut:
    - Judul: "${promptDetails.projectTitle}"
    - Durasi: ${promptDetails.duration} hari
    - Lokasi: "${promptDetails.location}"`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                key: { type: Type.STRING, description: 'Kunci unik format snake_case.' },
                question: { type: Type.STRING, description: 'Pertanyaan untuk pengguna.' },
                type: { type: Type.STRING, description: 'Tipe input: "text" atau "number".' }
            },
            required: ["key", "question", "type"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        const jsonText = response.text.trim();
        const questions = JSON.parse(jsonText);
        if (Array.isArray(questions)) {
            return questions;
        }
        throw new Error("AI did not return a valid array of questions.");
    } catch (error) {
        console.error("Error calling Gemini API for BQ questions:", error);
        throw new Error("Gagal membuat pertanyaan BQ dari AI.");
    }
}

/**
 * Step 2: Generates a Bill of Quantities (BQ) from a rich set of project details.
 * @param details The initial details plus user answers to dynamic questions.
 * @returns A promise that resolves to an array of BQ items.
 */
export async function generateBqFromDetails(details: {
    promptDetails: BqPromptDetails;
    answers: Record<string, string | number>;
    questions: DynamicQuestion[];
}): Promise<Omit<RabDetailItem, 'id' | 'isEditing' | 'isSaved'>[]> {
    
    let fullContext = `Detail Proyek Awal:
- Judul: "${details.promptDetails.projectTitle}"
- Durasi: ${details.promptDetails.duration} hari
- Lokasi: "${details.promptDetails.location}"
- Tipe Pekerja: "${details.promptDetails.workerType}"

Detail Tambahan dari Pengguna:`;

    details.questions.forEach(q => {
        const answer = details.answers[q.key];
        if (answer) {
            fullContext += `\n- Pertanyaan: ${q.question}\n  Jawaban: ${answer}`;
        }
    });

    const fullBq: Omit<RabDetailItem, 'id' | 'isEditing' | 'isSaved'>[] = [];

    // --- STEP 2a: Generate Categories from detailed context ---
    const categorySystemInstruction = `Anda adalah asisten ahli untuk membuat Bill of Quantity (BQ) untuk proyek konstruksi di Indonesia. Berdasarkan detail proyek yang lengkap, buat daftar NAMA KATEGORI pekerjaan utama.
    Keluarkan output HANYA dalam format array JSON string yang valid. Contoh: ["PEKERJAAN PERSIAPAN", "PEKERJAAN STRUKTUR"]. Jangan ada penjelasan lain.`;
    
    const categoryPrompt = `Buatkan daftar nama kategori BQ untuk proyek dengan detail berikut:\n${fullContext}`;
    const categoryResponseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };

    let categories: string[] = [];
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: categoryPrompt,
            config: { systemInstruction: categorySystemInstruction, temperature: 0.2, responseMimeType: "application/json", responseSchema: categoryResponseSchema }
        });
        categories = JSON.parse(response.text.trim());
        if (!Array.isArray(categories) || categories.some(c => typeof c !== 'string')) {
             throw new Error("API did not return a valid string array of categories.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for BQ categories:", error);
        throw new Error("Gagal membuat kategori BQ dari AI.");
    }
    
    if (categories.length === 0) {
        throw new Error("AI tidak menghasilkan kategori BQ.");
    }

    // --- STEP 2b: Generate Items for Each Category from detailed context ---
    const itemSystemInstruction = `Anda adalah asisten ahli BQ. Untuk sebuah proyek dan satu kategori pekerjaan, buat daftar item pekerjaan di bawahnya berdasarkan detail lengkap yang diberikan.
    Keluarkan output HANYA dalam format array JSON yang valid.
    Skema untuk setiap objek dalam array: { "uraianPekerjaan": "Nama item pekerjaan", "volume": number, "satuan": "string" }.
    Volume harus estimasi yang masuk akal. Jangan sertakan 'type' atau harga.`;

    const itemResponseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { uraianPekerjaan: { type: Type.STRING }, volume: { type: Type.NUMBER }, satuan: { type: Type.STRING } },
            required: ["uraianPekerjaan", "volume", "satuan"]
        }
    };
    
    for (const categoryName of categories) {
        fullBq.push({ type: 'category', uraianPekerjaan: categoryName.toUpperCase(), volume: 0, satuan: '', hargaSatuan: 0, keterangan: '' });
        const itemPrompt = `Proyek:\n${fullContext}\n\nBuatkan item-item pekerjaan BQ untuk kategori: "${categoryName}".`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: itemPrompt,
                config: { systemInstruction: itemSystemInstruction, temperature: 0.5, responseMimeType: "application/json", responseSchema: itemResponseSchema }
            });
            const items = JSON.parse(response.text.trim());
            
            if (Array.isArray(items)) {
                fullBq.push(...items.map(item => ({
                    type: 'item' as const,
                    uraianPekerjaan: item.uraianPekerjaan || '',
                    volume: item.volume || 0,
                    satuan: item.satuan || 'unit',
                    hargaSatuan: 0,
                    keterangan: '',
                })));
            }
        } catch (error) {
             console.error(`Error generating items for category "${categoryName}":`, error);
             fullBq.push({
                type: 'item', uraianPekerjaan: `Gagal generate item untuk kategori ini`, volume: 1, satuan: 'ls', hargaSatuan: 0,
                keterangan: 'Terjadi error saat menghubungi AI. Coba lagi atau isi manual.',
             });
        }
    }

    return fullBq;
}
