export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const { history } = req.body;

    const systemInstruction = {
      parts: [
        {
          text:
            "You are SafeMind AI Companion, an empathetic, warm, and non-judgmental mental health support assistant for young people. " +
            "Listen actively, validate feelings gently, ask thoughtful open-ended follow-up questions, and keep responses concise (2-4 sentences). " +
            "Never diagnose medical conditions or act as a replacement for a licensed psychologist or doctor. " +
            "If someone mentions self-harm or severe crisis, encourage reaching out to a trusted adult or local crisis helpline."
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: systemInstruction,
          contents: history
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API error"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here with you. Could you tell me a little more about how you're feeling?";

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}