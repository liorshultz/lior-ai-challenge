"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

const BITCOIN_LOGO = "/bitcoin-logo.png"; // Add this image to public/ for branding

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Welcome to the NYDIG Bitcoin Chat! Ask me anything about Bitcoin, NYDIG, or the API." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send message to backend
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    setLoading(true);
    const userMsg = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    try {
      // Prepare conversation history for context (exclude system messages)
      const conversation = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content }));
      conversation.push({ role: "user", content: input });
      // Get API URL from environment variable or default to '/api/chat'
      const API_URL = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : "/api/chat";
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: "You are a helpful Bitcoin and NYDIG assistant. Maintain context based on the conversation history provided.",
          user_message: JSON.stringify(conversation),
          model: "gpt-4.1-mini",
          api_key: "YOUR_API_KEY_HERE"
        })
      });
      if (!res.body) throw new Error("No response body");
      let aiMsg = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        aiMsg += decoder.decode(value);
        setMessages((msgs) => {
          // Only update the last AI message as it streams
          if (msgs[msgs.length - 1]?.role === "assistant") {
            return [...msgs.slice(0, -1), { role: "assistant", content: aiMsg }];
          } else {
            return [...msgs, { role: "assistant", content: aiMsg }];
          }
        });
        scrollToBottom();
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      height: "100vh",
      width: "100vw",
      background: "var(--background)",
      color: "var(--foreground)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 0,
      margin: 0,
      boxSizing: "border-box"
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0 1.5rem 0" }}>
        <Image src={BITCOIN_LOGO} alt="Bitcoin Logo" width={48} height={48} style={{ background: "#fff", borderRadius: "50%" }} />
        <h1 style={{ fontSize: "2rem", color: "var(--primary)", fontWeight: 700 }}>
          Oracle of Satoshi
        </h1>
      </header>
      <div style={{
        flex: 1,
        width: "100%",
        maxWidth: 900,
        background: "var(--bitcoin-dark)",
        color: "var(--bitcoin-light)",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        marginBottom: 24
      }}>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, maxHeight: "100%" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              margin: "12px 0",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              textAlign: "left"
            }}>
              <span style={{
                marginRight: 12,
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: msg.role === "user" ? "var(--primary)" : "#fff",
                boxShadow: msg.role === "user" ? "0 2px 8px rgba(0,191,174,0.10)" : "0 2px 8px rgba(247,147,26,0.10)",
                flexShrink: 0
              }}>
                {msg.role === "user" ? (
                  <span style={{ fontSize: 20, color: "#fff" }} role="img" aria-label="User">👤</span>
                ) : (
                  <Image src={BITCOIN_LOGO} alt="Bitcoin Logo" width={24} height={24} style={{ borderRadius: "50%" }} />
                )}
              </span>
              <span style={{
                display: "inline-block",
                background: msg.role === "user" ? "var(--primary)" : "var(--accent)",
                color: "#fff",
                borderRadius: 12,
                padding: "8px 16px",
                fontWeight: 500,
                maxWidth: "80%",
                wordBreak: "break-word",
                boxShadow: msg.role === "user" ? "0 2px 8px rgba(0,191,174,0.10)" : "0 2px 8px rgba(247,147,26,0.10)"
              }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--primary)",
              fontSize: 16,
              outline: "none"
            }}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0 20px",
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.2s"
            }}
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
      <footer style={{ color: "var(--foreground)", opacity: 0.7, marginTop: 16 }}>
        &copy; {new Date().getFullYear()} NYDIG Bitcoin Chat. Powered by Next.js
      </footer>
    </div>
  );
}
