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

  const prompt = `
You are an AI assistant tasked with analyzing images and creatively transforming them into Pokémon-like creatures. Your goal is to examine the provided image and generate a detailed description of a Pokémon based on the image's contents, following the style and conventions of the Pokémon universe.

Here is the image you will analyze:

<image>
{{IMAGE}}
</image>

Follow these steps to analyze the image and create a Pokémon-inspired description:

1. Identify the central object or focus of the image. This will be the basis for your Pokémon.
2. Consider the object's characteristics (extrapolated), including its appearance, purpose, material, and environment.
3. Use your creativity to transform these real-world characteristics into Pokémon features, abilities, and types.
4. Develop a complete Pokémon profile, including its current form and potential evolutions.
5. If you see a human, use their expression to assign their types, anger is fire, etc. etc.

Based on your analysis, create a JSON object with the following structure:
All fields are compulsory:
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
  },
  "height": string,
  "weight": string
}

Follow these guidelines when creating your Pokémon:

1. Base the level on the estimated age/complexity of the object (range: 1-65).
2. Assign exactly 4 unique moves to each form.
3. Use varied and creative type combinations, avoiding overuse of the Normal type.
4. Create names that follow Pokémon naming conventions: creative, catchy, and related to the object's features.
5. Write descriptions in the style of Pokédex entries, explaining the Pokémon's origin and behavior.
6. Ensure evolution names share some linguistic elements with the base form.
7. Assign stats between 1-100, reflecting the object's characteristics.
8. Consider the object's material, purpose, and features when assigning types.
9. Use standard Pokémon types but be creative with combinations.
10. Provide a height and weight for the Pokemon, be creative.


Remember to be creative and thorough in your analysis, ensuring that your Pokémon creation is both imaginative and consistent with the Pokémon universe.
  `;

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
