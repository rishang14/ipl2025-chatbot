export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

export const ai = new GoogleGenAI({});

const pinecone = new PineconeClient();
// Will automatically read the PINECONE_API_KEY
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    let doccontent = "";
    const latestmessge = messages[messages.length - 1]?.content;
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: latestmessge,
      config: {
        taskType: "QUESTION_ANSWERING",
        outputDimensionality: 1536,
      },
    });
    console.log(latestmessge, "latest message");
    try {
      if (!response.embeddings) return;
      const contents = await pineconeIndex.query({
        topK: 5,
        vector: response.embeddings[0].values as number[],
        includeValues: false,
        includeMetadata: true,
      });

      const docs = contents.matches
        .map((i) => i.metadata?.text)
        .filter(Boolean)
        .join("\n\n");
      const content = JSON.stringify(docs); 
       doccontent=content || ""

    } catch (error) {
      (doccontent = ""), console.log("error while querying the dbbbbb", error);
    }

    const systemprompt = `
You are an intelligent IPL (Indian Premier League) assistant with detailed knowledge about IPL season 2025.
Use the provided context to answer questions accurately and concisely.
#### Context:
${doccontent} 

### Rules:
1. Do NOT mention data sources.
2. Do NOT include images or links.
3. If asked about years before  2025, say:
   > "Sorry, I only have information from the IPL seasons  2025."
4. If the question is unclear or outside IPL, politely redirect the user to ask about IPL 2025.
5. Keep responses factual, brief, and conversational.
6. Never invent data. If not available, say:
   > "Sorry, I don’t have that specific information."


___________
Now respond as the official IPL Chatbot.
          `;

    const res = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
          ${systemprompt}

          User Question:
          ${latestmessge}
          `,
            },
          ],
        },
      ],
    });
// @ts-ignore
    console.log(">>>>>>>>..llm res ", res[0]?.text);
    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of res) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
            fullText += text;
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.log("some erro in api route", error);
  }
}
