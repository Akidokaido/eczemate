import React, { useState, useEffect, useRef } from "react";
import { Heart, Shield, Droplets, ArrowUp } from "lucide-react"; // Import ArrowUp icon

const aichat = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // For simulating typing
  const chatEndRef = useRef(null); // To scroll to the bottom when new messages are added

  // Scroll to the bottom whenever a new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return; // Don't send empty messages

    // Add user message to chat history
    setChatHistory([...chatHistory, { sender: "user", message }]);
    setLoading(true);
    setMessage("");

    // Simulate AI response (replace with real API call later)
    setIsTyping(true);

    // Call your API (chat.js) to get the AI's response
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      // Add AI response to chat history
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        { sender: "user", message },
        { sender: "ai", message: data.reply },
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        { sender: "ai", message: "Sorry, I couldn't fetch a response at the moment." },
      ]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-16">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 space-y-6">
        {/* Decorative floating cards */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-100 rounded-xl shadow-lg rotate-12"></div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-200 rounded-xl shadow-lg -rotate-12"></div>

        <h2 className="text-3xl font-extrabold text-blue-600 text-center">
          AI Chatbot - EczeMate+
        </h2>

        {/* Chat History */}
        <div className="max-h-[400px] overflow-y-scroll mb-6 space-y-4">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 max-w-xs rounded-xl shadow-md ${
                  chat.sender === "user" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {chat.message}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start space-x-2">
              <div className="p-4 max-w-xs rounded-xl bg-gray-100 text-gray-700 shadow-md">
                <span className="italic text-gray-500">AI is typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form className="flex space-x-4" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Ask me anything about eczema..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-auto bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-transform transform hover:-translate-y-1"
          >
            <ArrowUp className="w-6 h-6" /> {/* ArrowUp icon */}
          </button>
        </form>

        {/* Trust Indicators */}
        <div className="mt-6 flex justify-around items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            <span>Secure Communication</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-teal-600" />
            <span>Gentle on Skin</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-teal-600" />
            <span>Deep Hydration</span>
          </div>
        </div>
      </div>
      <div ref={chatEndRef} />
    </div>
  );
};

export default aichat;
