export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ""

    // Simple demo responses based on keywords
    let response = ""

    if (lastMessage.includes("newton") || lastMessage.includes("force") || lastMessage.includes("motion")) {
      response = `**Newton's Laws of Motion - NEET Focus**

**First Law (Law of Inertia):**
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**Second Law:**
F = ma (Force = mass × acceleration)
This is crucial for NEET problems involving dynamics.

**Third Law:**
For every action, there is an equal and opposite reaction.

**Study Tip:** Practice numerical problems involving all three laws. Focus on free body diagrams - they're essential for NEET physics problems!

**Common NEET Questions:**
- Calculate force when mass and acceleration are given
- Analyze motion on inclined planes
- Solve problems with multiple forces

Keep practicing! These concepts form the foundation of mechanics in NEET.`
    } else if (
      lastMessage.includes("photosynthesis") ||
      lastMessage.includes("plant") ||
      lastMessage.includes("chlorophyll")
    ) {
      response = `**Photosynthesis - NEET Biology**

**Definition:**
The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water.

**Equation:**
6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂

**Key Points for NEET:**
1. **Location:** Occurs in chloroplasts
2. **Pigments:** Chlorophyll a, b, carotenoids
3. **Two Stages:**
   - Light reactions (Thylakoids)
   - Dark reactions/Calvin cycle (Stroma)

**Important for NEET:**
- C3, C4, and CAM pathways
- Factors affecting photosynthesis
- Photorespiration concept

**Study Strategy:** Make flowcharts of light and dark reactions. Practice questions on limiting factors and different pathways.

This topic frequently appears in NEET with 2-3 questions annually!`
    } else if (
      lastMessage.includes("organic") ||
      lastMessage.includes("carbon") ||
      lastMessage.includes("hydrocarbon")
    ) {
      response = `**Organic Chemistry - NEET Preparation**

**Key Concepts:**
1. **Hybridization:** sp³, sp², sp
2. **Functional Groups:** Alcohols, Aldehydes, Ketones, Carboxylic acids
3. **Reactions:** Addition, Substitution, Elimination

**NEET Strategy:**
- **Name Reactions:** Learn Friedel-Crafts, Aldol condensation, etc.
- **Mechanisms:** Focus on SN1, SN2, E1, E2
- **Isomerism:** Structural and stereoisomerism

**High-Yield Topics:**
- Alcohols and Phenols
- Carbonyl compounds
- Carboxylic acids and derivatives
- Amines

**Study Tip:** Practice structure drawing daily. Make reaction charts for each functional group. Organic chemistry needs consistent practice!

Remember: Organic chemistry can fetch you 25-30 marks in NEET if prepared well!`
    } else {
      response = `I'm here to help with your NEET preparation! I can assist with:

**Physics Topics:**
- Mechanics, Thermodynamics, Optics
- Electricity & Magnetism, Modern Physics

**Chemistry Topics:**
- Physical, Organic, Inorganic Chemistry
- Chemical Bonding, Periodic Table

**Biology Topics:**
- Cell Biology, Genetics, Ecology
- Human Physiology, Plant Biology

**Study Tips:**
- Practice previous year questions
- Focus on NCERT thoroughly
- Make short notes for revision

Try asking specific questions like:
- "Explain electromagnetic induction"
- "What are the types of chemical bonds?"
- "Describe the structure of DNA"

What subject would you like to focus on today?`
    }

    // Simulate streaming by returning the response
    return new Response(response, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Demo chat error:", error)
    return new Response("Sorry, I encountered an error. Please try again.", {
      status: 500,
    })
  }
}
