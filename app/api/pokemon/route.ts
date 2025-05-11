import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GOOGLE_API_KEY!;

async function analyzePokemonImage(imageBase64: string) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const prompt = `Analyze this image as if it's a Pokemon. Be creative and consider real-world object characteristics to transform into Pokemon features. Return a JSON object with the following structure exactly:
  {
    "currentForm": {
      "name": string,
      "types": string[],
      "level": number,
      "description": string,
      "baseStats": {
        "hp": number,
        "attack": number,
        "defense": number,
        "specialAttack": number,
        "specialDefense": number,
        "speed": number
      },
      "abilities": string[],
      "moves": string[],
      "colorScheme": string[]
    },
    "evolutionChain": {
      "current": {
        "name": string,
        "level": number,
        "moves": string[],
        "description": string
      },
      "nextEvolution": {
        "name": string,
        "evolutionLevel": number,
        "moves": string[],
        "description": string
      },
      "finalEvolution": {
        "name": string,
        "evolutionLevel": number,
        "moves": string[],
        "description": string
      }
    }
  }

  Guidelines:
  - Base level on the estimated age/complexity of the object (1-65)
  - Each form should have exactly 4 unique moves
  - Use varied and creative type combinations (don't just use Normal type)
  - Names should follow Pokemon naming conventions (creative, catchy, related to object's features)
  - Descriptions should be Pokedex-style entries explaining origin and behavior
  - Evolution names should share some linguistic elements with the base form
  - Stats should be between 1-100 and reflect the object's characteristics
  - Consider object's material, purpose, and features when assigning types
  - Use standard Pokemon types but be creative with combinations`;

  const parts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(',')[1],
      },
    },
    { text: prompt },
  ];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,

    });

    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error in Gemini API:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const output = await analyzePokemonImage(image);
    
    try {
      const jsonResponse = JSON.parse(output);
      return NextResponse.json(jsonResponse);
    } catch (e) {
      return NextResponse.json({
        error: "Failed to parse AI response as JSON",
        rawResponse: output
      });
    }
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
