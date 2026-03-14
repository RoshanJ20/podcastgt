/**
 * @module embeddings
 *
 * Generates text embeddings for semantic search over podcast transcripts.
 *
 * Key responsibilities:
 * - Convert text input into vector embeddings using OpenAI's embedding model.
 *
 * Dependencies:
 * - Requires OPENAI_API_KEY environment variable.
 *
 * TODO(team): Replace placeholder with real OpenAI integration once API key is provisioned.
 */

/**
 * Generate a vector embedding for the given text.
 *
 * @param _text - The text to embed (unused in placeholder implementation).
 * @returns A numeric array representing the embedding vector.
 * @throws Error always in the current placeholder — will be replaced with actual OpenAI call.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  throw new Error('AI search not yet implemented. Add OPENAI_API_KEY to enable.')
}
