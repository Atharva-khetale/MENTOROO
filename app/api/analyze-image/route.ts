import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const image = formData.get("image") as File
    const question = formData.get("question") as string

    if (!image || !question) {
      return new Response("Missing image or question", { status: 400 })
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const imageUrl = `data:${image.type};base64,${base64}`

    // Check if Together API key is available, otherwise use demo response
    if (!process.env.TOGETHERE_API_KEY) {
      // Demo response for image analysis
      const demoResponse = `**Image Analysis (Demo Mode)**

I can see you've uploaded an image with the question: "${question}"

**Demo Analysis:**
This appears to be a NEET-related study material. Here's what I can help you with:

**For Physics Images:**
- Diagram explanations and concept breakdowns
- Formula derivations and applications
- Problem-solving step-by-step solutions

**For Chemistry Images:**
- Molecular structure analysis
- Reaction mechanism explanations
- Organic chemistry pathway discussions

**For Biology Images:**
- Anatomical structure identification
- Process flow explanations
- Cellular mechanism descriptions

**Note:** This is a demo response. For full image analysis capabilities, please configure your TOGETHERE_API_KEY environment variable.

**Study Tip:** Try to break down complex diagrams into smaller components and understand each part individually before connecting them together.`

      return new Response(demoResponse)
    }

    // Use Together AI for image analysis
    const together = createOpenAI({
      apiKey: process.env.TOGETHERE_API_KEY,
      baseURL: "https://api.together.xyz/v1",
    })

    const systemPrompt = `You are a NEET tutor specialized in analyzing educational images. 
    Analyze the uploaded image and answer the student's question with detailed explanations.
    Focus on NEET-relevant concepts and provide step-by-step breakdowns when applicable.
    If it's a diagram, explain each component. If it's a problem, solve it step by step.
    Always relate your explanation to NEET exam patterns and important concepts.`

    const result = await generateText({
      model: together("meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${systemPrompt}\n\nQuestion: ${question}` },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      maxTokens: 800,
    })

    return new Response(result.text)
  } catch (error) {
    console.error("Error analyzing image:", error)
    return new Response("Error analyzing image. Please try again.", { status: 500 })
  }
}
