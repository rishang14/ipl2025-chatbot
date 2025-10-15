import { GoogleGenAI } from "@google/genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { scrapePage } from "./helper";

export const ai = new GoogleGenAI({});

const ipldata = [
  "https://en.wikipedia.org/wiki/2025_Indian_Premier_League",
  // "https://en.wikipedia.org/wiki/2024_Indian_Premier_League",
];

const pinecone = new PineconeClient();
// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);


// export async function createIndex(){
//   // Pod-based index
// await pinecone.createIndex({
//   name: 'iplchat',
//   dimension: 1536,
//   metric: 'cosine',
//   spec: {
//     serverless: {
//       cloud:"aws",
//       region: 'us-east-1',
//     }
//   }
// }); 
// console.log("index created")
// }



const spliter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

export async function loadData() {
  try {
    // const collection = await db.collection(process.env.ASTRA_COLLECTION!);

    for await (const url of ipldata) {
      const content = await scrapePage(url);
      const chunks = await spliter.splitText(content); 
      
      const batchSize = 50;
      let vectorsBatch: any[] = [];
      for await (const text of chunks) {
        const response = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality:1536
          },
        });
      //  @ts-ignore
        const vector = response.embeddings[0]?.values; 
        console.log(vector); 
        console.log(response.embeddings," the thing i am embedding ")

        // Prepare vector for Pinecone
        vectorsBatch.push({
          id: `${url}+ ${Math.random() * 1000}`, // unique ID for each chunk
          values: vector,
          metadata: {
            text,
            source: url,
          },
        });

        // Upload to Pinecone in batches
        if (vectorsBatch.length === batchSize) {
          console.log(`⬆️ Uploading batch of ${vectorsBatch.length} vectors`);
          await pineconeIndex.upsert(vectorsBatch);
          vectorsBatch = []; // reset batch
        }
      }
    }
  } catch (error) {
    console.error("in loading the data", error);
  }
}
