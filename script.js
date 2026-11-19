document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const newChatBtn = document.getElementById("new-chat-btn");

  const initialGreeting =
    "Hi there! I'm here to listen without any judgment. How are you feeling today?";

  let conversationHistory = [
    { role: "model", parts: [{ text: initialGreeting }] }
  ];

  function addMessage(text, sender = "bot") {
    if (!chatMessages) return null;

    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "user" ? "user-message" : "bot-message";
    msgDiv.textContent = text;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  async function handleSend() {
    if (!chatInput || !chatMessages) return;

    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    chatInput.value = "";
    chatInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    conversationHistory.push({
      role: "user",
      parts: [{ text }]
    });

    const typingMsg = addMessage("Thinking...", "bot");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: conversationHistory })
      });

      const data = await res.json();
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      addMessage(data.reply, "bot");
      conversationHistory.push({
        role: "model",
        parts: [{ text: data.reply }]
      });
    } catch (error) {
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      addMessage(
        "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        "bot"
      );
    } finally {
      chatInput.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  function handleNewChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = "";
    conversationHistory = [
      { role: "model", parts: [{ text: initialGreeting }] }
    ];
    addMessage(initialGreeting, "bot");
    if (chatInput) {
      chatInput.value = "";
      chatInput.focus();
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", handleSend);

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  if (newChatBtn) newChatBtn.addEventListener("click", handleNewChat);
});