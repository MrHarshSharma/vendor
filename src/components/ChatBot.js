import React, { useState, useRef, useEffect } from "react";
import { Drawer, Input, Spin } from "antd";
import { SendOutlined, CloseOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import ChatMenuItem from "./ChatMenuItem";

// Get API key
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// ─── Helpers ───────────────────────────────────────────────

function isVegItem(item) {
  if (typeof item.veg_nonveg === "string")
    return item.veg_nonveg.toLowerCase() === "veg";
  if (typeof item.veg_nonveg === "boolean") return item.veg_nonveg;
  return item.isVeg || item.veg || item.vegetarian || item.type === "veg";
}

/** Flatten menu object into a single array, tagging each item with its category */
function flattenMenu(menu) {
  const items = [];
  for (const [category, list] of Object.entries(menu)) {
    for (const item of list) {
      items.push({ ...item, _category: category });
    }
  }
  return items;
}

// ─── Intent Classifier ────────────────────────────────────

const INTENT_PATTERNS = {
  veg: /\b(veg|vegetarian|veggie|plant.?based|no\s*meat)\b/i,
  nonveg: /\b(non.?veg|non.?vegetarian|meat|chicken|mutton|fish|prawn|egg|lamb|keema)\b/i,
  category: /\b(starter|appetizer|snack|main\s*course|main|entree|dessert|sweet|drink|beverage|soup|salad|bread|roti|naan|biryani|rice|thali|combo)\b/i,
  price: /\b(under|below|less\s*than|cheap|budget|affordable|expensive|premium|above|over)\s*[₹$]?\s*(\d+)?|\b[₹$]\s*(\d+)/i,
  people: /\b(\d+)\s*(people|person|persons|guests|pax|log|logo)\b|\bfamily\b|\bcouple\b|\bgroup\b/i,
  spicy: /\b(spicy|spice|hot|mild|less\s*spicy)\b/i,
  popular: /\b(popular|best|top|recommend|suggestion|favourite|favorite|must\s*try|signature)\b/i,
  all: /\b(show\s*(me\s*)?all|full\s*menu|everything|entire|complete)\b/i,
};

// Stop words to strip when extracting search keywords
const STOP_WORDS = new Set([
  "show", "me", "do", "you", "have", "any", "some", "the", "a", "an",
  "what", "which", "is", "are", "there", "give", "get", "want", "need",
  "i", "we", "us", "my", "our", "please", "can", "could", "would",
  "like", "hai", "kya", "kuch", "mein", "ke", "ka", "ki", "ko",
  "dikhao", "batao", "de", "do", "hain", "ye", "wo", "aur",
  "suggest", "recommend", "try", "good", "best",
]);

function extractSearchKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[?,!.'"]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function classifyIntent(query) {
  const q = query.toLowerCase().trim();
  const intents = {};

  // Diet
  if (INTENT_PATTERNS.veg.test(q) && !INTENT_PATTERNS.nonveg.test(q)) {
    intents.diet = "veg";
  } else if (INTENT_PATTERNS.nonveg.test(q)) {
    intents.diet = "nonveg";
  }

  // Category
  const catMatch = q.match(INTENT_PATTERNS.category);
  if (catMatch) {
    intents.category = catMatch[1].toLowerCase();
  }

  // Price
  const priceMatch = q.match(INTENT_PATTERNS.price);
  if (priceMatch) {
    const amount = parseInt(priceMatch[2] || priceMatch[3], 10);
    if (/under|below|less|cheap|budget|affordable|sasta/i.test(q)) {
      intents.priceMax = amount || 300;
    } else if (/above|over|expensive|premium|mehenga/i.test(q)) {
      intents.priceMin = amount || 500;
    }
  }

  // People count
  const peopleMatch = q.match(INTENT_PATTERNS.people);
  if (peopleMatch) {
    if (/couple/i.test(q)) intents.people = 2;
    else if (/family/i.test(q)) intents.people = 4;
    else if (/group/i.test(q)) intents.people = 6;
    else intents.people = parseInt(peopleMatch[1], 10) || 2;
  }

  // Flags
  if (INTENT_PATTERNS.spicy.test(q)) intents.spicy = true;
  if (INTENT_PATTERNS.popular.test(q)) intents.popular = true;
  if (INTENT_PATTERNS.all.test(q)) intents.showAll = true;

  // Extract search keywords for item name matching
  intents.searchKeywords = extractSearchKeywords(q);

  // Determine if this can be resolved locally
  // Now also local if we have search keywords (name search)
  const hasFilters = intents.diet || intents.category || intents.priceMax || intents.priceMin || intents.showAll;
  const hasKeywords = intents.searchKeywords.length > 0;
  intents.canResolveLocally = (hasFilters || hasKeywords) && !intents.people && !intents.spicy && !intents.popular;

  return intents;
}

// ─── Local Retrieval ──────────────────────────────────────

const CATEGORY_ALIASES = {
  starter: ["starter", "appetizer", "snack", "appetiser"],
  main: ["main", "main course", "entree", "curry", "gravy"],
  dessert: ["dessert", "sweet", "mithai"],
  drink: ["drink", "beverage", "juice", "lassi", "shake", "mocktail", "cocktail"],
  bread: ["bread", "roti", "naan", "paratha", "kulcha"],
  rice: ["rice", "biryani", "pulao", "pulav"],
  soup: ["soup", "shorba"],
  salad: ["salad", "raita"],
  thali: ["thali", "combo", "meal"],
};

function matchesCategory(categoryName, searchTerm) {
  const catLower = categoryName.toLowerCase();
  const termLower = searchTerm.toLowerCase();

  // Direct match
  if (catLower.includes(termLower) || termLower.includes(catLower)) return true;

  // Alias match
  for (const aliases of Object.values(CATEGORY_ALIASES)) {
    if (aliases.some((a) => termLower.includes(a))) {
      if (aliases.some((a) => catLower.includes(a))) return true;
    }
  }

  return false;
}

function localRetrieve(menu, intents) {
  let items = flattenMenu(menu);

  // Filter by diet
  if (intents.diet === "veg") {
    items = items.filter((item) => isVegItem(item));
  } else if (intents.diet === "nonveg") {
    items = items.filter((item) => !isVegItem(item));
  }

  // Step 1: Try item name search first (most specific)
  const keywords = (intents.searchKeywords || []).filter(
    (kw) =>
      // Exclude generic filter words already handled above
      !["veg", "vegetarian", "veggie", "nonveg", "non"].includes(kw) &&
      !["under", "below", "above", "over", "cheap", "expensive", "sasta", "mehenga"].includes(kw) &&
      !["starter", "appetizer", "main", "dessert", "sweet", "drink", "beverage", "bread", "soup", "salad", "thali", "combo", "meal"].includes(kw)
  );

  if (keywords.length > 0) {
    const nameMatched = items.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const descLower = (item.description || "").toLowerCase();
      return keywords.some(
        (kw) => nameLower.includes(kw) || descLower.includes(kw)
      );
    });

    if (nameMatched.length > 0) {
      // Name search found results — use these directly
      items = nameMatched;
    } else if (intents.category) {
      // No name matches, fall back to category
      const catFiltered = items.filter((item) =>
        matchesCategory(item._category, intents.category)
      );
      if (catFiltered.length > 0) items = catFiltered;
    }
    // If neither name nor category matched, keep full list (filtered by diet/price)
  } else if (intents.category) {
    // No keywords, just category filter
    const catFiltered = items.filter((item) =>
      matchesCategory(item._category, intents.category)
    );
    if (catFiltered.length > 0) items = catFiltered;
  }

  // Filter by price
  if (intents.priceMax) {
    items = items.filter((item) => item.price <= intents.priceMax);
  }
  if (intents.priceMin) {
    items = items.filter((item) => item.price >= intents.priceMin);
  }

  // Clean up internal fields before returning
  return items.map(({ _category, ...rest }) => rest);
}

// ─── Focused Context Builder (for AI calls) ──────────────

function buildFocusedContext(menu, intents, currencySymbol = "₹") {
  let items = flattenMenu(menu);

  // Pre-filter to reduce context sent to AI
  if (intents.diet === "veg") {
    items = items.filter((item) => isVegItem(item));
  } else if (intents.diet === "nonveg") {
    items = items.filter((item) => !isVegItem(item));
  }

  // Use search keywords for name-based filtering
  const keywords = (intents.searchKeywords || []).filter(
    (kw) =>
      !["veg", "vegetarian", "veggie", "nonveg", "non"].includes(kw) &&
      !["under", "below", "above", "over", "cheap", "expensive", "sasta", "mehenga"].includes(kw) &&
      !["starter", "appetizer", "main", "dessert", "sweet", "drink", "beverage", "bread", "soup", "salad", "thali", "combo", "meal"].includes(kw)
  );

  if (keywords.length > 0) {
    const nameMatched = items.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const descLower = (item.description || "").toLowerCase();
      return keywords.some(
        (kw) => nameLower.includes(kw) || descLower.includes(kw)
      );
    });
    if (nameMatched.length > 0) items = nameMatched;
    else if (intents.category) {
      const catFiltered = items.filter((item) =>
        matchesCategory(item._category, intents.category)
      );
      if (catFiltered.length > 0) items = catFiltered;
    }
  } else if (intents.category) {
    const catFiltered = items.filter((item) =>
      matchesCategory(item._category, intents.category)
    );
    if (catFiltered.length > 0) items = catFiltered;
  }

  if (intents.priceMax) {
    items = items.filter((item) => item.price <= intents.priceMax);
  }
  if (intents.priceMin) {
    items = items.filter((item) => item.price >= intents.priceMin);
  }

  // Format the filtered items
  const lines = [];
  let currentCat = "";
  for (const item of items) {
    if (item._category !== currentCat) {
      currentCat = item._category;
      lines.push(`\n## ${currentCat}`);
    }
    let line = `- "${item.name}" (${currencySymbol}${item.price})`;
    line += ` [${isVegItem(item) ? "Vegetarian" : "Non-Vegetarian"}]`;
    if (item.description) line += ` — ${item.description}`;
    lines.push(line);
  }

  return { text: lines.join("\n"), count: items.length };
}

// ─── Gemini API ───────────────────────────────────────────

async function callGeminiAPI(prompt, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const contents = [
    ...history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: [{ text: prompt }] },
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
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

// ─── Response Parsers ─────────────────────────────────────

function parseItemNames(response) {
  const names = [];

  // Method 1: Quoted strings
  const quotedMatches = response.match(/"([^"]+)"/g);
  if (quotedMatches) {
    quotedMatches.forEach((match) => {
      const name = match.replace(/"/g, "").trim();
      if (name && !names.includes(name)) names.push(name);
    });
  }

  // Method 2: Comma-separated
  if (names.length === 0 && response.includes(",")) {
    response.split(",").forEach((part) => {
      const name = part.replace(/["']/g, "").trim();
      if (name && name.length > 2 && !names.includes(name)) names.push(name);
    });
  }

  // Method 3: Newline-separated
  if (names.length === 0) {
    response.split("\n").forEach((line) => {
      const name = line
        .replace(/^[-*•\d.)\s]+/, "")
        .replace(/["']/g, "")
        .trim();
      if (name && name.length > 2 && !names.includes(name)) names.push(name);
    });
  }

  return names;
}

function findMenuItems(menu, itemNames) {
  const foundItems = [];
  const addedNames = new Set();

  for (const searchName of itemNames) {
    const searchLower = searchName.toLowerCase().trim();

    for (const items of Object.values(menu)) {
      for (const item of items) {
        const itemNameLower = item.name.toLowerCase().trim();
        if (addedNames.has(itemNameLower)) continue;

        if (
          itemNameLower.includes(searchLower) ||
          searchLower.includes(itemNameLower) ||
          searchLower
            .split(" ")
            .some((word) => word.length > 3 && itemNameLower.includes(word))
        ) {
          foundItems.push(item);
          addedNames.add(itemNameLower);
        }
      }
    }
  }

  return foundItems;
}

// ─── Intro Generator ──────────────────────────────────────

function generateIntro(intents, itemCount) {
  if (intents.diet === "veg") {
    const opts = [
      "Here are our vegetarian picks:",
      "Fresh veg options for you:",
      "Our best vegetarian dishes:",
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (intents.diet === "nonveg") {
    const opts = [
      "Here are our non-veg specials:",
      "Meaty goodness coming up:",
      "Our best non-veg dishes:",
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (intents.category) {
    return `Here's what we have in ${intents.category}:`;
  }
  if (intents.priceMax) {
    return `Great options under ₹${intents.priceMax}:`;
  }
  if (intents.people) {
    return `Perfect spread for ${intents.people} people:`;
  }
  if (itemCount >= 4) {
    const opts = [
      "Here's a great spread for you:",
      "This should be perfect:",
      "A delicious combo:",
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  const opts = [
    "You'll love these!",
    "Great choice! Try these:",
    "These are popular picks:",
    "Good taste! Check these out:",
  ];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── Component ────────────────────────────────────────────

const ChatBot = ({ storeDetails, storeId, visible, onClose }) => {
  const drawerVisible = visible;
  const setDrawerVisible = (val) => {
    if (!val && onClose) onClose();
  };
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get store data from Redux if not passed directly
  const storeFromRedux = useSelector((state) => state.storeReducer.store);
  const store = storeDetails || storeFromRedux;

  // Chat storage key per restaurant
  const chatStorageKey = `chat_${storeId || "default"}`;

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

  // Initialize welcome message when drawer opens
  useEffect(() => {
    if (drawerVisible && store?.menu && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm your menu assistant. Ask me for recommendations and I'll show you dishes you can add directly to your cart!",
          type: "text",
        },
      ]);
    }
  }, [drawerVisible, store, messages.length]);

  const sendMessage = async (messageText) => {
    const question = messageText || inputValue.trim();
    if (!question || loading) return;

    const menu = store?.menu;
    if (!menu) return;

    setInputValue("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question, type: "text" },
    ]);
    setLoading(true);

    try {
      // Step 1: Classify intent locally
      const intents = classifyIntent(question);
      console.log("Intent:", intents);

      let resultItems = [];

      if (intents.canResolveLocally) {
        // ── Fast path: resolve entirely on the client ──
        console.log("RAG: Local resolution (no API call)");
        resultItems = localRetrieve(menu, intents);
      } else {
        // ── AI path: build focused context and call Gemini ──
        console.log("RAG: AI-assisted resolution");

        if (!API_KEY) {
          // Fallback if no API key — try local retrieval anyway
          resultItems = localRetrieve(menu, intents);
        } else {
          const { text: focusedContext, count } = buildFocusedContext(
            menu,
            intents,
            store.currencySymbol || "₹"
          );

          const prompt = `You are a menu assistant. Return ONLY item names from this menu.

MENU (${count} items):
${focusedContext}

RULES:
1. Return ONLY item names in quotes, separated by commas
2. NO explanations, NO prices, ONLY names in quotes
3. If customer mentions NUMBER OF PEOPLE: suggest a balanced mix (starters + mains + dessert)
4. For "popular/best/recommend": pick a varied, appealing selection
5. For "spicy": pick items that sound spicy from their names or descriptions
6. Match the request as closely as possible to the available items

Customer request: "${question}"

Response format: "Item1", "Item2", "Item3"`;

          const response = await callGeminiAPI(prompt, []);
          const itemNames = parseItemNames(response);
          resultItems = findMenuItems(menu, itemNames);

          // If AI returned nothing, try local retrieval as fallback
          if (resultItems.length === 0) {
            console.log("RAG: AI returned no matches, falling back to local");
            resultItems = localRetrieve(menu, intents);
          }
        }
      }

      if (resultItems.length > 0) {
        const intro = generateIntro(intents, resultItems.length);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "items",
            items: resultItems,
            intro: intro,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't find matching items. Try asking differently!",
            type: "text",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Please try again.",
          type: "text",
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
      <Drawer
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        height="85vh"
        className="chat-drawer"
        styles={{
          content: {
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          },
          body: {
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
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
            <span className="chat-subtitle">
              Ask me anything about our menu
            </span>
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
                <div className="chat-items-response">
                  {msg.intro && (
                    <div className="chat-items-intro">{msg.intro}</div>
                  )}
                  <div className="chat-items-grid">
                    {msg.items.map((item, idx) => (
                      <ChatMenuItem
                        key={idx}
                        item={item}
                        storeDetails={store}
                      />
                    ))}
                  </div>
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

        {/* Quick Suggestions */}
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
                  cursor:
                    inputValue.trim() && !loading ? "pointer" : "not-allowed",
                }}
              >
                <SendOutlined
                  style={{
                    fontSize: "18px",
                    color:
                      inputValue.trim() && !loading ? "#1A1A1A" : "#A1A1AA",
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
