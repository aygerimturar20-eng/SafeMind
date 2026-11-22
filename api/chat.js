export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
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

    const models = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash"
];

    let data = null;
    let lastError = null;

    for (const model of models) {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            system_instruction: systemInstruction,
            contents: history
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        data = result;
        break;
      }

      lastError = result;
      if (response.status !== 503 && response.status !== 404) {
        break;
      }
    }

    if (!data) {
      return res.status(503).json({
        error: "AI companion is taking a short breath due to high traffic. Please try again in a few seconds.",
        details: lastError
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here with you. Could you tell me a little more about how you're feeling?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
