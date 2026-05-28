import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, MessageSquare } from "lucide-react";

const AiChat = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [requestTimestamps, setRequestTimestamps] = useState([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const sendToAI = async (text) => {
    if (loading) return; // Debouncing

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = requestTimestamps.filter(t => t > oneMinuteAgo);

    if (recentRequests.length >= 5) {
      setChatHistory(prev => [
        ...prev,
        { sender: "user", message: text },
        { sender: "ai", message: "⚠️ Rate limit exceeded: You are sending messages too quickly. Please wait a minute before asking another question." }
      ]);
      return;
    }

    setRequestTimestamps([...recentRequests, now]);
    setChatHistory(prev => [...prev, { sender: "user", message: text }]);
    setLoading(true);
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      setChatHistory(prev => [
        ...prev,
        { sender: "ai", message: data.reply },
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setChatHistory(prev => [
        ...prev,
        { sender: "ai", message: "Sorry, I couldn't fetch a response at the moment." },
      ]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const text = message;
    setMessage("");
    sendToAI(text);
  };

  const handleQuickQuestion = (q) => {
    if (loading) return;
    sendToAI(q);
  };

  const quickQuestions = [
    "What are common eczema triggers?",
    "What foods should I avoid?",
    "How does stress affect eczema?",
    "Tips for managing flare-ups"
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-10 px-4 flex justify-center relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0D9488]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F97316]/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col h-[calc(100vh-160px)]">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-[#0D9488]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
              AI Eczema Assistant <Sparkles className="w-4 h-4 text-[#F97316]" />
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Personalized Guidance & Support
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
          
          {/* Chat History Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-[#FAFAFA]/30">
            {chatHistory.length === 0 && (
              <div className="flex items-start gap-4 animate-fade-in-up">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-sm p-5 text-[14px] leading-relaxed text-slate-600 max-w-3xl shadow-sm">
                  <p className="font-medium text-[#1C1917] mb-2">Hello! I'm your eczema care assistant.</p>
                  I can help you with information about flare-up management, trigger avoidance, skin care routines, and answer questions about eczema. How can I assist you today?
                  <div className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            )}

            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start gap-4"} animate-fade-in-up`}
              >
                {chat.sender === "ai" && (
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-[#0D9488]" />
                  </div>
                )}
                <div
                  className={`p-5 max-w-2xl shadow-sm text-[14px] leading-relaxed ${
                    chat.sender === "user" 
                      ? "bg-[#0D9488] text-white rounded-3xl rounded-br-sm font-medium shadow-[#0D9488]/20" 
                      : "bg-white border border-slate-100 text-slate-700 rounded-3xl rounded-tl-sm"
                  }`}
                >
                  {chat.message}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start gap-4 animate-fade-in-up">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div className="p-5 max-w-xs rounded-3xl rounded-tl-sm bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions & Input Area */}
          <div className="bg-white border-t border-slate-100 p-6 md:p-8 relative z-20 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
            {chatHistory.length === 0 && (
              <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <p className="text-[11px] text-slate-400 mb-3 font-bold uppercase tracking-widest">Suggested Questions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickQuestions.map((q, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleQuickQuestion(q)} 
                      disabled={loading}
                      className="text-left px-5 py-3.5 rounded-2xl border border-slate-100 bg-white hover:border-[#0D9488]/30 hover:shadow-md hover:-translate-y-0.5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-[13px] text-slate-600 hover:text-[#0D9488] transition-all font-medium disabled:opacity-50 flex items-center justify-between group"
                    >
                      {q}
                      <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form className="relative w-full" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Ask me anything about eczema management..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-6 pr-16 py-4 rounded-full border border-slate-200 bg-white focus:outline-none focus:border-[#0D9488]/30 focus:ring-4 focus:ring-[#0D9488]/[0.06] text-[14px] text-[#1C1917] placeholder-slate-400 transition-all duration-300 shadow-sm"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[#0D9488] hover:bg-[#0f766e] disabled:opacity-50 text-white rounded-full transition-all duration-300 shadow-[0_2px_10px_rgb(13,148,136,0.2)]"
              >
                <Send className="w-4 h-4 ml-0.5" /> 
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AiChat;
