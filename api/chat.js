import OpenAI from "openai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Initialize OpenAI client with the API key from environment variables
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the openai completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-3.5-turbo" if you prefer
      messages: [
        {
          role: "system",
          content: `
You are EczeMate, an AI health assistant that helps users understand and manage eczema.
Answer in a friendly and professional tone.
Keep responses short and clear — 2 to 4 sentences maximum.
Only give safe, general health information related to eczema.
If a question is not related to eczema, reply:
"I'm sorry, I can only answer questions related to eczema care and management."
If the user asks for personal medical advice, tell them to consult a doctor.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    // AI reply
    const reply = response.choices[0].message.content;

    // Send the reply back to frontend
    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
}
