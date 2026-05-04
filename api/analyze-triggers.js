import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { entries } = req.body;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "No journal entries provided for analysis." });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format entries for the AI
    const formattedEntries = entries.map((entry, idx) => {
      return `Entry ${idx + 1}:
- Date: ${new Date(entry.createdAt?.seconds * 1000 || entry.createdAt).toLocaleDateString()}
- Emotion: ${entry.emotion}
- Food Log: ${entry.foodLog || "None"}
- Thoughts: ${entry.entry}
`;
    }).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are EczeMate, an expert AI dermatological assistant. 
Your task is to analyze the patient's recent journal entries and identify potential eczema triggers (like specific foods, stress/emotions, or environmental factors mentioned in their thoughts).

Guidelines:
1. Be extremely concise. Provide a 2-3 sentence insight.
2. If you notice a pattern (e.g., negative emotions when eating dairy), point it out clearly.
3. Use a supportive, empathetic tone.
4. Always add a disclaimer that this is an AI analysis and they should consult their doctor for medical advice.
5. If there is not enough data to find a pattern, just say "You're doing a great job logging! Keep adding more entries (especially food) so I can help identify your specific triggers."
          `,
        },
        {
          role: "user",
          content: `Here are my latest journal entries. Please analyze them for triggers:\n\n${formattedEntries}`,
        },
      ],
    });

    const insight = response.choices[0].message.content;

    res.status(200).json({ insight });
  } catch (error) {
    console.error("Error in /api/analyze-triggers:", error);
    res.status(500).json({ error: "Failed to analyze triggers." });
  }
}
