import { useEffect, useState, useRef } from "react";
import "./App.css";

// Add type declaration for the marked library
declare global {
  interface Window {
    marked: {
      parse: (text: string) => string;
      marked: (text: string) => string;
    };
  }
}

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages and system message from localStorage on initial render
  useEffect(() => {
    try {
      // Load chat messages
      const savedMessages = localStorage.getItem("chatMessages");
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        console.log("Loading saved messages:", parsedMessages);
        setMessages(parsedMessages);
      }

      // Load system message
      const savedSystemMessage = localStorage.getItem("systemMessage");
      if (savedSystemMessage) {
        setSystemMessage(savedSystemMessage);
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // If there's an error, clear the corrupted localStorage
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("systemMessage");
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      // Skip initial empty state save which would overwrite loaded messages
      if (messages.length > 0) {
        console.log("Saving messages to localStorage:", messages);
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input after loading is complete
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare placeholder for assistant response
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          config: systemMessage ? { systemMessage } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from response");
      }

      let assistantResponse = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        assistantResponse += text;

        // Update the assistant message with streamed content
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: assistantResponse,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  // Save system message to localStorage whenever it changes
  useEffect(() => {
    try {
      if (systemMessage) {
        localStorage.setItem("systemMessage", systemMessage);
      }
    } catch (error) {
      console.error("Error saving system message to localStorage:", error);
    }
  }, [systemMessage]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  const saveSystemMessage = (message: string) => {
    setSystemMessage(message);
    closeModal();
  };

  // System message modal component
  const SystemMessageModal = () => {
    const [modalInput, setModalInput] = useState(systemMessage);

    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
          isModalOpen ? "" : "hidden"
        }`}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Set System Message</h2>
          <textarea
            className="w-full h-40 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="You are a friendly assistant"
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
          />
          <div className="flex justify-between space-x-2">
            <button
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              onClick={() => setModalInput("")}
            >
              Clear
            </button>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white rounded-lg hover:bg-blue-900"
                style={{ backgroundColor: "var(--blue-button)" }}
                onClick={() => saveSystemMessage(modalInput)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full mx-auto px-4 sm:px-6">
      <header className="py-4 flex justify-between items-center sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-bold text-center">👩‍💻💬🗨️🤖</h1>
        <div className="w-10">
          <button
            onClick={openModal}
            className="p-2 text-sm bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg border border-gray-200 pb-16"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            Your conversation will appear here.
          </div>
        ) : (
          <div className="flex flex-col space-y-6 w-full">
            {messages.map((message, index) => (
              <div key={index} className="w-full">
                {message.role === "user" ? (
                  <div className="text-left text-gray-800 max-w-[85%] sm:max-w-[75%] mb-2">
                    {message.content}
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-lg max-w-[85%] sm:max-w-[75%]"
                    style={{ backgroundColor: "var(--assistant-bg)" }}
                  >
                    <div
                      className="markdown-content text-left"
                      dangerouslySetInnerHTML={{
                        __html: window.marked.parse
                          ? window.marked.parse(message.content)
                          : window.marked.marked(message.content),
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex space-x-2 w-full mb-16 sticky bottom-12 bg-white py-2 z-10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Type a message..."
          ref={inputRef}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-900"
          style={{ backgroundColor: "var(--blue-button)" }}
        >
          Send
        </button>
        <button
          type="button"
          onClick={clearChat}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Clear
        </button>
      </form>

      {/* System Message Modal */}
      <SystemMessageModal />

      {/* Footer */}
      <footer
        className="text-center py-3 text-sm fixed bottom-0 left-0 right-0 z-20 shadow-md"
        style={{ backgroundColor: "var(--assistant-bg)" }}
      >
        <p>
          Built with{" "}
          <span role="img" aria-label="orange heart">
            🧡
          </span>{" "}
          using{" "}
          <a
            href="https://developers.cloudflare.com/workers-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--blue-button)" }}
          >
            Cloudflare Workers AI
          </a>{" "}
          and the{" "}
          <a
            href="https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--blue-button)" }}
          >
            Llama 4 Scout
          </a>{" "}
          model
        </p>
      </footer>
    </div>
  );
}

export default App;
