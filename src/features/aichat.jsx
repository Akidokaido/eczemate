import React, { useState, useEffect, useRef } from "react";
import { Heart, Shield, Droplets, ArrowUp } from "lucide-react";

const AiChat = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatHistory([...chatHistory, { sender: "user", message }]);
    setLoading(true);
    setMessage("");
    setIsTyping(true);
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
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4 py-16 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0D9488]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F97316]/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-8 space-y-6 z-10">
        {/* Decorative floating cards */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-[#0D9488]/10 rounded-2xl shadow-lg shadow-[#0D9488]/5 border border-[#0D9488]/20 rotate-12"></div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[#F97316]/10 rounded-2xl shadow-lg shadow-[#F97316]/5 border border-[#F97316]/20 -rotate-12"></div>

        <h2 className="text-3xl font-extrabold text-[#1C1917] tracking-tight text-center">
          AI Chatbot <span className="text-[#0D9488]">EczeMate+</span>
        </h2>

        {/* Chat History */}
        <div ref={chatContainerRef} className="max-h-[400px] overflow-y-scroll mb-6 space-y-4">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 max-w-xs rounded-2xl shadow-sm text-sm font-medium ${
                  chat.sender === "user" ? "bg-[#0D9488] text-white rounded-br-sm" : "bg-[#FDFBF7] border border-slate-100 text-[#1C1917] rounded-bl-sm"
                }`}
              >
                {chat.message}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start space-x-2">
              <div className="p-4 max-w-xs rounded-2xl rounded-bl-sm bg-[#FDFBF7] border border-slate-100 text-[#1C1917] shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form className="flex space-x-4 relative" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Ask me anything about eczema..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-[#FDFBF7] focus:outline-none focus:bg-white focus:border-[#0D9488]/20 focus:ring-4 focus:ring-[#0D9488]/[0.06] text-[#1C1917] placeholder-[#94a3b8] transition-all duration-300"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-[#0D9488] hover:bg-[#0f766e] disabled:opacity-50 text-white rounded-xl shadow-md shadow-[#0D9488]/20 transition-all duration-300"
          >
            <ArrowUp className="w-5 h-5" /> 
          </button>
        </form>

       
      </div>
    </div>
  );
};

export default AiChat;
