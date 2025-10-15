# 🏏 IPL 2025 RAG System — Intelligent Q&A on IPL Data 


Vidoe   :  [Link:](https://www.linkedin.com/feed/update/urn:li:activity:7384201617190866944/)

This project is a **Retrieval-Augmented Generation (RAG)** pipeline that allows users to **ask questions about IPL 2025** and get precise, LLM-generated answers — all based on **real scraped data**.

Built using **LangChain.js**, **Puppeteer**, and **Pinecone**, it demonstrates how to scrape live web data, embed it into vectors, and query it through an LLM with relevant context.

---

## 🚀 Features

- 🕸️ **Web Scraping** — Extracts IPL 2025 data from Wikipedia using Puppeteer  
- ✂️ **Text Chunking** — Splits raw text into semantically meaningful chunks using LangChain  
- 🧠 **Embeddings** — Converts chunks into vector embeddings  
- 💾 **Vector Database (Pinecone)** — Stores embeddings for fast and accurate similarity search  
- 🤖 **LLM Integration** — Retrieves the most relevant context and generates precise answers  
- ⚡ **LangChain-Powered Pipeline** — Handles splitting, embeddings, and retrieval logic seamlessly  

---

## 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Scraping** | [Puppeteer](https://pptr.dev/) |
| **Orchestration** | [LangChain.js](https://js.langchain.com/) |
| **Vector Store** | [Pinecone](https://www.pinecone.io/) |
| **Embeddings** |Google gemini |
| **Runtime** | Node.js (JavaScript / TypeScript) |

---

## ⚙️ System Architecture

```bash
Wikipedia (IPL 2025 Page)
       ↓
[Scraper: Puppeteer]
       ↓
[Text Splitter: LangChain.js]

