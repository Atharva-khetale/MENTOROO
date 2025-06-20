import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Check if Together API key is available
    if (!process.env.TOGETHERE_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Together API key not configured. Please set TOGETHERE_API_KEY environment variable.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create Together AI client using OpenAI-compatible interface
    const together = createOpenAI({
      apiKey: process.env.TOGETHERE_API_KEY,
      baseURL: "https://api.together.xyz/v1",
    })

    // Create system prompt for NEET-focused responses
    const systemPrompt = `You are a helpful AI tutor specifically designed for NEET (National Eligibility cum Entrance Test) students in India. 
    You specialize in Physics, Chemistry, and Biology at the 11th and 12th grade level. 
    Provide clear, concise explanations with examples. When explaining concepts, break them down step by step.
    Always encourage the student and provide study tips when relevant. Keep responses focused and educational.
    Use simple language and provide practical examples that help students understand complex concepts.
    When possible, relate concepts to real-world applications and NEET exam patterns.
    
    Format your responses clearly with:
    - Main concept explanation
    - Step-by-step breakdown when needed
    - Practical examples
    - Study tips or exam relevance when applicable
    
    Keep responses concise but comprehensive, suitable for NEET preparation.`

    const result = streamText({
      model: together("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 600,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)

    // Return a more helpful error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return new Response(
      JSON.stringify({
        error: `Together AI service error: ${errorMessage}. Please check your TOGETHERE_API_KEY configuration.`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
