// TODO: Implement "Ask the Podcast" AI search using OpenAI embeddings + Supabase pgvector
// This file is scaffolded for future implementation when API keys are provided.

// import OpenAI from 'openai'
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// export async function generateEmbedding(text: string): Promise<number[]> {
//   const response = await openai.embeddings.create({
//     model: 'text-embedding-3-small',
//     input: text,
//   })
//   return response.data[0].embedding
// }

export async function generateEmbedding(_text: string): Promise<number[]> {
  // Placeholder — replace with actual implementation
  throw new Error('AI search not yet implemented. Add OPENAI_API_KEY to enable.')
}
