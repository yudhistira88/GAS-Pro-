

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
 * Generates a Bill of Quantities (BQ) from a rich set of project details in a single call.
 * @param details The initial details of the project.
 * @returns A promise that resolves to an array of BQ items.
 */
export async function generateBqStructure(details: BqPromptDetails): Promise<Omit<RabDetailItem, 'id' | 'isEditing' | 'isSaved'>[]> {
    const systemInstruction = `Anda adalah seorang Quantity Surveyor (QS) ahli untuk proyek konstruksi di Indonesia. Berdasarkan detail proyek yang diberikan, buat struktur Bill of Quantity (BQ) yang terdiri dari kategori pekerjaan utama dan item pekerjaan di bawahnya.
    - Keluarkan output HANYA dalam format array JSON yang valid.
    - Setiap elemen dalam array adalah objek dengan skema: { "type": "category" | "item", "uraianPekerjaan": string, "volume": number, "satuan": string }.
    - Untuk "category", volume harus 0 dan satuan kosong.
    - Untuk "item", berikan estimasi volume yang masuk akal.
    - Urutkan item di bawah kategori yang sesuai.`;

    const prompt = `Buatkan struktur BQ untuk proyek berikut:
    - Judul: "${details.projectTitle}"
    - Durasi: ${details.duration} hari
    - Lokasi: "${details.location}"
    - Tipe Pekerja: "${details.workerType}"`;
    
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                uraianPekerjaan: { type: Type.STRING },
                volume: { type: Type.NUMBER },
                satuan: { type: Type.STRING }
            },
            required: ["type", "uraianPekerjaan", "volume", "satuan"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        const result = JSON.parse(response.text.trim());
        if (Array.isArray(result)) {
            return result.map(item => ({
                ...item,
                hargaSatuan: 0,
                keterangan: '',
            }));
        }
        throw new Error("AI did not return a valid BQ structure array.");
    } catch (error) {
        console.error("Error calling Gemini API for BQ structure:", error);
        throw new Error("Gagal membuat struktur BQ dari AI.");
    }
}
