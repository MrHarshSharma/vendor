import React, { useState, useRef, useEffect } from "react";
import { Drawer, Input, Spin } from "antd";
import { MessageOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import ChatMenuItem from "./ChatMenuItem";

// Get API key
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

/**
 * Format menu data into readable string for AI context
 */
function formatMenuForAI(menu, currencySymbol = "₹") {
  let formatted = "";
  for (const [category, items] of Object.entries(menu)) {
    formatted += `\n## ${category}\n`;
    items.forEach((item) => {
      formatted += `- "${item.name}" (${currencySymbol}${item.price})`;
      if (item.veg_nonveg) {
        const isVeg = typeof item.veg_nonveg === 'string'
          ? item.veg_nonveg.toLowerCase() === 'veg'
          : item.veg_nonveg === true;
        formatted += ` [${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}]`;
      }
      formatted += "\n";
    });
  }
  return formatted;
}

/**
 * Find menu items by names
 */
function findMenuItems(menu, itemNames) {
  const foundItems = [];
  const addedNames = new Set();

  for (const searchName of itemNames) {
    const searchLower = searchName.toLowerCase().trim();

    for (const [category, items] of Object.entries(menu)) {
      for (const item of items) {
        const itemNameLower = item.name.toLowerCase().trim();

        // Check if already added
        if (addedNames.has(itemNameLower)) continue;

        // Match if names are similar
        if (
          itemNameLower.includes(searchLower) ||
          searchLower.includes(itemNameLower) ||
          // Also try matching individual words
          searchLower.split(' ').some(word =>
            word.length > 3 && itemNameLower.includes(word)
          )
        ) {
          foundItems.push(item);
          addedNames.add(itemNameLower);
        }
      }
    }
  }

  console.log("Found items:", foundItems.map(i => i.name));
  return foundItems;
}

/**
 * Call Gemini API directly using REST
 */
async function callGeminiAPI(prompt, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const contents = [
    ...history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    })),
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Gemini API Error:", error);
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Parse AI response to extract item names
 */
function parseItemNames(response) {
  console.log("AI Response:", response);

  const names = [];

  // Method 1: Match quoted strings "Item Name"
  const quotedMatches = response.match(/"([^"]+)"/g);
  if (quotedMatches) {
    quotedMatches.forEach(match => {
      const name = match.replace(/"/g, '').trim();
      if (name && !names.includes(name)) {
        names.push(name);
      }
    });
  }

  // Method 2: Split by comma if response has commas
  if (names.length === 0 && response.includes(',')) {
    response.split(',').forEach(part => {
      const name = part.replace(/["']/g, '').trim();
      if (name && name.length > 2 && !names.includes(name)) {
        names.push(name);
      }
    });
  }

  // Method 3: Split by newlines
  if (names.length === 0) {
    response.split('\n').forEach(line => {
      const name = line.replace(/^[-*•\d.)\s]+/, '').replace(/["']/g, '').trim();
      if (name && name.length > 2 && !names.includes(name)) {
        names.push(name);
      }
    });
  }

  console.log("Parsed item names:", names);
  return names;
}

const ChatBot = ({ storeDetails, storeId }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const messagesEndRef = useRef(null);

  // Get store data from Redux if not passed directly
  const storeFromRedux = useSelector((state) => state.storeReducer.store);
  const store = storeDetails || storeFromRedux;

  // Chat storage key per restaurant
  const chatStorageKey = `chat_${storeId || 'default'}`;

  // Initialize messages from localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(chatStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    }
  }, [messages, chatStorageKey]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize system prompt when drawer opens
  useEffect(() => {
    if (drawerVisible && store?.menu && API_KEY) {
      const menuContext = formatMenuForAI(store.menu, store.currencySymbol || "₹");

      const prompt = `You are a menu assistant. Your ONLY job is to return item names from this menu.

MENU:
${menuContext}

RULES:
1. Return ONLY item names in quotes, separated by commas
2. Return 3-4 items that match the customer's request
3. NO explanations, NO prices, ONLY names in quotes
4. If customer asks for "vegetarian" or "veg" - return ONLY items marked [Vegetarian]
5. If customer asks for "non-veg" - return ONLY items marked [Non-Vegetarian]
6. If customer asks for "starters" - return appetizer/starter items
7. If customer asks for "main course" - return main dish items

EXAMPLE:
Customer: "show me veg dishes"
Response: "Veg Thali", "Paneer Tikka", "Dal Makhani", "Bhendi"

Customer: "what starters do you have"
Response: "Tandoori Phool", "Paneer Tikka", "Chicken Wings"`;

      setSystemPrompt(prompt);

      // Only set welcome message if no saved messages
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: "Hi! I'm your menu assistant. Ask me for recommendations and I'll show you dishes you can add directly to your cart!",
            type: "text"
          },
        ]);
      }
    }
  }, [drawerVisible, store, messages.length]);

  const sendMessage = async (messageText) => {
    const question = messageText || inputValue.trim();
    if (!question || loading || !systemPrompt) return;

    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: question, type: "text" }]);
    setLoading(true);

    try {
      // Always send full context with each question
      const fullPrompt = `${systemPrompt}

Customer request: "${question}"

Return the exact item names from the menu that match this request. Format: "Item1", "Item2", "Item3"`;

      const response = await callGeminiAPI(fullPrompt, []);

      // Parse item names from response
      const itemNames = parseItemNames(response);

      // Find matching menu items
      const foundItems = findMenuItems(store?.menu || {}, itemNames);

      if (foundItems.length > 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "items", items: foundItems },
        ]);
      } else {
        // Fallback to text if no items found
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't find matching items. Try asking differently!", type: "text" },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Please try again.",
          type: "text"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setDrawerVisible(true)}
        aria-label="Open menu assistant"
      >
        <MessageOutlined style={{ fontSize: "24px" }} />
      </button>

      {/* Chat Drawer */}
      <Drawer
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        height="85vh"
        className="chat-drawer"
        styles={{
          content: {
            backgroundColor: "#2B3041",
            color: "white",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
          },
          body: {
            backgroundColor: "#2B3041",
            color: "white",
            padding: "0",
            display: "flex",
            flexDirection: "column",
          },
          mask: { backdropFilter: "blur(3px)" },
        }}
      >
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <span className="chat-title">Menu Assistant</span>
            <span className="chat-subtitle">Ask me anything about our menu</span>
          </div>
          <button
            className="chat-close-btn"
            onClick={() => setDrawerVisible(false)}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Messages Container */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
            >
              {msg.type === "items" ? (
                <div className="chat-items-grid">
                  {msg.items.map((item, idx) => (
                    <ChatMenuItem
                      key={idx}
                      item={item}
                      storeDetails={store}
                    />
                  ))}
                </div>
              ) : (
                <div className="message-content">{msg.content}</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant-message">
              <div className="message-content typing-indicator">
                <Spin size="small" />
                <span style={{ marginLeft: "8px" }}>Finding items...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions - show only at the start */}
        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {[
              "Show me vegetarian dishes",
              "Suggest something spicy",
              "What starters do you have?",
            ].map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-container">
          <Input
            className="chat-input"
            placeholder="Ask about our menu..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            suffix={
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || loading}
                className="chat-send-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: inputValue.trim() && !loading ? "pointer" : "not-allowed",
                }}
              >
                <SendOutlined
                  style={{
                    fontSize: "18px",
                    color: inputValue.trim() && !loading ? "#FDD874" : "#6B7280",
                  }}
                />
              </button>
            }
          />
        </div>
      </Drawer>
    </>
  );
};

export default ChatBot;
