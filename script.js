/* =============================================
   VeyoGPT — Main Script (Claude-style)
   ============================================= */

// ───── System Prompt ─────
const systemPrompt = `You are VEYO AI — a smart, Gen-Z style, multi-purpose AI assistant.Sound modern, sharp, and human. Use casual slang and light roasting when appropriate.Be witty and lightly humorous. Roast ideas, not people.`;

// ───── Adaptive Greeting Engine ─────
const GREETING_DATA = {
    firstTime: [
        "Welcome. Let’s build something cool.",
        "First time here? Let’s make it count.",
        "New session. Fresh start.",
        "You’re in. Let’s create something smart.",
        "Ready to begin something meaningful?"
    ],
    returning: [
        "Back again. I like the consistency.",
        "You’re back. Let’s upgrade something.",
        "Return detected. Respect.",
        "Continuing where we left off?",
        "Good to see you again."
    ],
    morning: [
        "Fresh brain. Fresh ideas.",
        "Morning energy. Let’s focus.",
        "New day. Let’s build.",
        "Start strong.",
        "Morning clarity activated."
    ],
    afternoon: [
        "Midday momentum.",
        "Let’s keep the flow going.",
        "Focus mode, activated.",
        "Still grinding? Good.",
        "What are we solving now?"
    ],
    lateNight: [
        "Late night grind? Respect.",
        "Still awake? Let’s use it wisely.",
        "Midnight thinking hits different.",
        "Night mode activated.",
        "Deep thoughts hour."
    ],
    default: [
        "Yo. What are we solving today?",
        "Hey. Brain online. Let’s cook.",
        "What’s the mission?",
        "You bring the chaos. I’ll bring the logic.",
        "Alright, drop the prompt.",
        "System awake. Ideas loading.",
        "Let’s build something cool.",
        "What are we breaking down today?",
        "Ready when you are.",
        "Input received. Let’s think."
    ],
    smart: [
        "Let’s build something meaningful.",
        "Clarity mode activated.",
        "Ready to optimize your thinking.",
        "Drop the problem. We’ll structure it.",
        "Precision thinking starts now.",
        "Let’s turn complexity into clarity.",
        "What are we engineering today?",
        "High-focus mode engaged.",
        "Let’s design a better answer.",
        "Strategic thinking online."
    ],
    creative: [
        "What are we creating today?",
        "Let’s ship something elite.",
        "Got an idea? Let’s refine it.",
        "Time to turn thoughts into systems.",
        "Blueprint mode activated.",
        "Let’s architect something clean.",
        "Show me the raw idea. I’ll sharpen it.",
        "Creative engine warmed up.",
        "Let’s make it unfairly good.",
        "Ready to innovate?"
    ],
    playful: [
        "Brain cells assembled.",
        "Thinking cap secured.",
        "Neurons are stretching.",
        "Let’s run the giga-brain.",
        "Data’s waiting.",
        "Let’s do something smart.",
        "Vibes detected. Logic loading.",
        "Deploying intelligence.",
        "System calibrated.",
        "Ready to overthink productively."
    ],
    minimal: [
        "Ready.", "Let’s begin.", "What’s next?", "Input?", "Proceed.",
        "Thinking enabled.", "Start typing.", "Initialized.", "System ready.", "Let’s go."
    ]
};

const AdaptiveGreetingEngine = {
    sessionCount: 0,
    lastGreetings: [],
    currentGreeting: "",

    init() {
        // Load state
        this.sessionCount = parseInt(localStorage.getItem('veyo_session_count') || 0) + 1;
        localStorage.setItem('veyo_session_count', this.sessionCount);
        
        this.lastGreetings = JSON.parse(localStorage.getItem('veyo_last_greetings') || '[]');
        
        // Select greeting
        this.currentGreeting = this.selectGreeting();
        
        // Update history
        this.updateHistory(this.currentGreeting);
    },

    selectGreeting() {
        const hour = new Date().getHours();
        let pool = [];

        // 1. First-Time User
        if (this.sessionCount === 1) {
            pool = GREETING_DATA.firstTime;
        } 
        // 2. Returning User (Mix of Returning + Time/Mode)
        else {
            // Add Returning greetings
            pool = pool.concat(GREETING_DATA.returning);

            // Time-Based
            if (hour >= 5 && hour < 12) pool = pool.concat(GREETING_DATA.morning);
            else if (hour >= 12 && hour < 18) pool = pool.concat(GREETING_DATA.afternoon);
            else if (hour >= 22 || hour < 5) pool = pool.concat(GREETING_DATA.lateNight);
            
            // Add some Default/Smart/Creative based on randomness or implicit "mode"
            // For now, we mix in Default and a random specific mode to keep it fresh
            pool = pool.concat(GREETING_DATA.default);
            
            const randomMode = Math.random();
            if (randomMode > 0.7) pool = pool.concat(GREETING_DATA.smart);
            else if (randomMode > 0.4) pool = pool.concat(GREETING_DATA.creative);
            else if (randomMode > 0.1) pool = pool.concat(GREETING_DATA.playful);
        }

        // Filter out recently used greetings
        const available = pool.filter(g => !this.lastGreetings.includes(g));
        
        // Fallback if pool exhausted
        const finalPool = available.length > 0 ? available : GREETING_DATA.default;
        
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    },

    updateHistory(greeting) {
        this.lastGreetings.push(greeting);
        if (this.lastGreetings.length > 3) {
            this.lastGreetings.shift();
        }
        localStorage.setItem('veyo_last_greetings', JSON.stringify(this.lastGreetings));
    }
};

// Initialize Engine
AdaptiveGreetingEngine.init();

// ───── Multi-Chat State ─────
let allChats = [];
let activeChatId = null;
let conversationHistory = [];

// ───── DOM References ─────
const chatContainer = document.getElementById("chatContainer");
const chatScroll = document.getElementById("chatScroll");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const themeToggle = document.getElementById("themeToggle");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const overlay = document.getElementById("overlay");
const modelSelect = document.getElementById("modelSelect");
const chatHistoryEl = document.getElementById("chatHistory");

let isWaiting = false;

// ───── Suggestions ─────
const SUGGESTIONS = {
    default: [
        "Write a Python script to scrape a website",
        "Explain the theory of relativity",
        "Design a modern landing page",
        "How to center a div in CSS?",
        "Create a React todo app",
        "What is the meaning of life?",
        "Debug this JavaScript code",
        "Write a poem about coding"
    ],
    context: [
        "Tell me more about that",
        "Can you explain it simply?",
        "Give me an example",
        "What are the pros and cons?",
        "How do I fix this error?",
        "Refactor the code above",
        "Write unit tests for this",
        "Optimize for performance"
    ]
};

function renderSuggestions() {
    const container = document.getElementById("suggestionContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Don't show suggestions if waiting for response
    if (isWaiting) return;
    
    let pool = [];
    if (conversationHistory.length === 0) {
        pool = SUGGESTIONS.default;
    } else {
        // Simple context-aware simulation
        pool = SUGGESTIONS.context;
    }
    
    // Pick 3-4 random suggestions
    const count = window.innerWidth < 700 ? 3 : 4;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
    
    shuffled.forEach(text => {
        const chip = document.createElement("div");
        chip.className = "suggestion-chip";
        chip.textContent = text;
        chip.addEventListener("click", () => {
            if (userInput) {
                userInput.value = text;
                userInput.focus();
                userInput.style.height = "auto";
                userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
                // Removed handleSend() to allow manual sending
            }
        });
        container.appendChild(chip);
    });
}

// ───── Theme ─────
function initTheme() {
    const saved = localStorage.getItem("veyogpt-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("veyogpt-theme", next);
}

initTheme();
if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}

// ───── Model Selector ─────
const modelPicker = document.getElementById("modelPicker");
const modelTrigger = document.getElementById("modelTrigger");
const modelDropdown = document.getElementById("modelDropdown");
const currentModelText = document.getElementById("currentModelText");

let selectedModelId = DEFAULT_MODEL;

function initModelSelector() {
    if (typeof AVAILABLE_MODELS === 'undefined') return;
    
    // Load saved model
    const saved = localStorage.getItem("veyogpt-model");
    if (saved && AVAILABLE_MODELS.find(m => m.id === saved)) {
        selectedModelId = saved;
    }

    renderModelDropdown();
    updateModelTrigger();
}

function renderModelDropdown() {
    if (!modelDropdown) return;
    modelDropdown.innerHTML = "";
    
    AVAILABLE_MODELS.forEach(m => {
        const option = document.createElement("div");
        option.className = `model-option ${m.id === selectedModelId ? 'active' : ''}`;
        option.textContent = m.name;
        option.addEventListener("click", () => selectModel(m.id));
        modelDropdown.appendChild(option);
    });
}

function updateModelTrigger() {
    const model = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    if (currentModelText && model) {
        currentModelText.textContent = model.name;
    }
}

function selectModel(id) {
    selectedModelId = id;
    localStorage.setItem("veyogpt-model", id);
    renderModelDropdown();
    updateModelTrigger();
    if (modelPicker) modelPicker.classList.remove("open");
}

function getSelectedModel() { return selectedModelId; }

// Event Listeners
if (modelTrigger) {
    modelTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (modelPicker) modelPicker.classList.toggle("open");
    });
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (modelPicker && !modelPicker.contains(e.target)) {
        modelPicker.classList.remove("open");
    }
});

initModelSelector();

// ───── Sidebar ─────
function openSidebar() {
    document.body.classList.remove("sidebar-collapsed");
    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("active");
}

function closeSidebar() {
    document.body.classList.add("sidebar-collapsed");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
}

function initSidebar() {
    const collapsed = localStorage.getItem("veyogpt-sidebar-collapsed");
    // Default to closed (if null) or if set to true
    if (collapsed === "true" || collapsed === null) {
        document.body.classList.add("sidebar-collapsed");
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
        localStorage.setItem("veyogpt-sidebar-collapsed", "true");
    } else {
        document.body.classList.remove("sidebar-collapsed");
        if (sidebar) sidebar.classList.add("open");
        if (overlay) overlay.classList.add("active");
    }
}

initSidebar();

if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        openSidebar();
        localStorage.setItem("veyogpt-sidebar-collapsed", "false");
    });
}

if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", () => {
        closeSidebar();
        localStorage.setItem("veyogpt-sidebar-collapsed", "true");
    });
}

if (overlay) {
    overlay.addEventListener("click", () => {
        closeSidebar();
        localStorage.setItem("veyogpt-sidebar-collapsed", "true"); // Ensure state is saved
    });
}

// ───── Textarea auto-resize ─────
if (userInput) {
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
    });

    // ───── Enter to send ─────
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

if (sendBtn) sendBtn.addEventListener("click", handleSend);

// ───── New Chat ─────
if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
        saveCurrentChat();
        createNewChat();
        closeSidebar();
    });
}

// ───── Search ─────
const chatSearch = document.getElementById("chatSearch");
if (chatSearch) {
    chatSearch.addEventListener("input", () => renderChatList());
}

// ───── Keyboard Shortcuts ─────
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        if (document.body.classList.contains("sidebar-collapsed")) {
            openSidebar();
            localStorage.setItem("veyogpt-sidebar-collapsed", "false");
        } else {
            closeSidebar();
            localStorage.setItem("veyogpt-sidebar-collapsed", "true");
        }
    }
    if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        if (newChatBtn) newChatBtn.click();
    }
    if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        if (chatSearch) chatSearch.focus();
    }
});

// ───── Settings ─────
const settingsBtn = document.getElementById("settingsBtn");
const toastNotification = document.getElementById("toastNotification");

let toastTimeout;

function showToast() {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastNotification.classList.add("show");
    
    // Auto-hide after 3 seconds
    toastTimeout = setTimeout(() => {
        toastNotification.classList.remove("show");
    }, 3000);
}

if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
        showToast();
    });
}

// Interactive: Click to dismiss immediately
if (toastNotification) {
    toastNotification.addEventListener("click", () => {
        if (toastTimeout) clearTimeout(toastTimeout);
        toastNotification.classList.remove("show");
    });
}

// ───── Multi-Chat ─────
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createNewChat() {
    const chat = { id: generateId(), title: "New Chat", history: [] };
    allChats.unshift(chat);
    activeChatId = chat.id;
    conversationHistory = chat.history;
    renderChatUI();
    renderChatList();
    saveChatsToStorage();
    userInput.focus();
}

function switchToChat(chatId) {
    if (chatId === activeChatId) return;
    saveCurrentChat();
    const chat = allChats.find((c) => c.id === chatId);
    if (!chat) return;
    activeChatId = chat.id;
    conversationHistory = chat.history;
    renderChatUI();
    renderChatList();
    if (window.innerWidth <= 700) closeSidebar();
}

function deleteChat(chatId) {
    allChats = allChats.filter((c) => c.id !== chatId);
    saveChatsToStorage();
    if (chatId === activeChatId) {
        if (allChats.length > 0) {
            activeChatId = allChats[0].id;
            conversationHistory = allChats[0].history;
        } else {
            createNewChat();
            return;
        }
    }
    renderChatUI();
    renderChatList();
}

function saveCurrentChat() {
    const chat = allChats.find((c) => c.id === activeChatId);
    if (chat) chat.history = conversationHistory;
    saveChatsToStorage();
}

function updateChatTitle(chatId, firstMessage) {
    const chat = allChats.find((c) => c.id === chatId);
    if (chat && chat.title === "New Chat") {
        chat.title = firstMessage.length > 40
            ? firstMessage.substring(0, 40) + "…"
            : firstMessage;
        renderChatList();
        saveChatsToStorage();
    }
}

// ───── Render Chat UI ─────
function getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

function renderChatUI() {
    chatContainer.innerHTML = "";
    if (conversationHistory.length === 0) {
        chatContainer.innerHTML = `
        <div class="welcome" id="welcome">
          <svg class="v-svg-container" viewBox="0 0 100 100">
              <defs>
                  <linearGradient id="veyoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#d9774f" />
                      <stop offset="50%" style="stop-color:#ffae8f" />
                      <stop offset="100%" style="stop-color:#d9774f" />
                  </linearGradient>
              </defs>
              <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" class="v-text-path">V</text>
          </svg>
          <h1>${getTimeGreeting()}</h1>
          <p>${AdaptiveGreetingEngine.currentGreeting}</p>
        </div>`;
    } else {
        conversationHistory.forEach((msg, index) => {
            const type = msg.role === "user" ? "user" : "ai";
            appendMessageDOM(type, msg.content, index);
        });
        scrollToBottom();
    }
    renderSuggestions();
}

// ───── Render Sidebar Chat List ─────
function renderChatList() {
    chatHistoryEl.innerHTML = "";
    const searchTerm = chatSearch ? chatSearch.value.toLowerCase() : "";

    allChats.forEach((chat) => {
        if (searchTerm && !chat.title.toLowerCase().includes(searchTerm)) return;

        const item = document.createElement("button");
        item.className = "chat-history-item" + (chat.id === activeChatId ? " active" : "");
        item.innerHTML = `
            <span class="chat-title">${escapeHtml(chat.title)}</span>
            <button class="chat-delete-btn" aria-label="Delete chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>`;

        item.addEventListener("click", (e) => {
            if (e.target.closest(".chat-delete-btn")) return;
            switchToChat(chat.id);
        });

        item.querySelector(".chat-delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });

        chatHistoryEl.appendChild(item);
    });
}

// ───── Storage ─────
function saveChatsToStorage() {
    localStorage.setItem("veyogpt-chats", JSON.stringify(allChats));
    localStorage.setItem("veyogpt-active-chat", activeChatId);
}

function loadChatsFromStorage() {
    try {
        const stored = localStorage.getItem("veyogpt-chats");
        const activeId = localStorage.getItem("veyogpt-active-chat");
        if (stored) allChats = JSON.parse(stored);
        if (allChats.length > 0) {
            activeChatId = allChats.find((c) => c.id === activeId) ? activeId : allChats[0].id;
            conversationHistory = allChats.find((c) => c.id === activeChatId).history;
        } else {
            createNewChat();
            return;
        }
        renderChatUI();
        renderChatList();
    } catch {
        createNewChat();
    }
}

loadChatsFromStorage();

// ───── Preview Modal ─────
const previewModal = document.getElementById("previewModal");
const closePreviewBtn = document.getElementById("closePreviewBtn");
const previewFrame = document.getElementById("previewFrame");

function closePreview() {
    previewModal.classList.remove("active");
    // Clear iframe to stop scripts
    setTimeout(() => {
        const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        doc.open();
        doc.write("");
        doc.close();
    }, 300);
}

if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", closePreview);
}

// Close on click outside
if (previewModal) {
    previewModal.addEventListener("click", (e) => {
        if (e.target === previewModal) closePreview();
    });
}

// Global function for the Run button
window.openPreview = function (btn) {
    const wrapper = btn.closest(".code-wrapper");
    if (!wrapper) return;
    const codeEl = wrapper.querySelector("code");
    if (!codeEl) return;

    const code = codeEl.textContent;
    
    // Basic validation (non-empty)
    if (!code.trim()) return;

    previewModal.classList.add("active");
    
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
};

// ───── Markdown Config ─────
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function (code, language, escaped) {
    // Check for HTML to enable Run button
    if (language === "html") {
        const highlighted = hljs.highlight(code, { language: "html" }).value;
        return `
            <div class="code-wrapper" style="position: relative;">
                <button class="code-run-btn" onclick="openPreview(this)" aria-label="Run code">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Run
                </button>
                <pre><code class="hljs language-html">${highlighted}</code></pre>
            </div>`;
    }
    
    // Default renderer for other languages
    // Use highlight.js if language is valid
    const validLang = hljs.getLanguage(language) ? language : "plaintext";
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
};

marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true,
});

// ───── Handle Send ─────
let abortController = null;

const QUICK_THINK_LINES = [
    "Snapping up your answer...",
    "Brain ping received...",
    "Lightweight processing engaged...",
    "Quick-thinking mode activated...",
    "Minimal compute, max clarity...",
    "Speed-running intelligence...",
    "Fast-lane cognition...",
    "Micro-thought deployed...",
    "Instant synthesis underway...",
    "Rapid neural spark...",
    "Quick response brewing...",
    "Efficiency mode: ON",
    "Swift logic pass...",
    "Processing at light speed...",
    "Compact reasoning in motion..."
];

const DEEP_THINK_LINES = [
    "Engaging deep cognition layers...",
    "Parsing complexity vectors...",
    "Allocating extended reasoning bandwidth...",
    "Running multi-phase analysis...",
    "Expanding neural pathways...",
    "Cross-referencing knowledge graphs...",
    "Executing high-depth synthesis...",
    "Activating long-form reasoning engine...",
    "Constructing layered response architecture...",
    "Scanning multi-domain data clusters...",
    "Decompressing semantic structures...",
    "Initiating strategic compute cycle...",
    "Running advanced inference protocol...",
    "Mapping conceptual frameworks...",
    "Assembling high-density output...",
    "Calibrating precision reasoning...",
    "Deploying extended cognitive stack..."
];

const TRANSITION_LINES = [
    "Scaling cognitive load...",
    "Increasing reasoning depth...",
    "Expanding analysis scope..."
];

function getRandomLine(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function startThinking(container) {
    // Initial HTML structure
    container.innerHTML = `
        <div class="thinking-container">
            <div class="thinking-logo">V<div class="thinking-logo-fill"></div></div>
            <div class="thinking-text">${getRandomLine(QUICK_THINK_LINES)}</div>
        </div>
    `;

    const textEl = container.querySelector(".thinking-text");
    const startTime = Date.now();
    
    // Interval to update text based on elapsed time
    const intervalId = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000; // in seconds
        let newLine = "";

        if (elapsed < 3) {
            // Quick Mode (0-3s)
            newLine = getRandomLine(QUICK_THINK_LINES);
        } else if (elapsed < 6) {
            // Transition (3-6s)
            newLine = getRandomLine(TRANSITION_LINES);
        } else {
            // Deep Think Mode (6s+)
            newLine = getRandomLine(DEEP_THINK_LINES);
        }

        // Avoid repeating the same line immediately if possible
        if (textEl.textContent === newLine) {
            // Simple retry once to get a different one
             if (elapsed < 3) newLine = getRandomLine(QUICK_THINK_LINES);
             else if (elapsed < 6) newLine = getRandomLine(TRANSITION_LINES);
             else newLine = getRandomLine(DEEP_THINK_LINES);
        }

        textEl.textContent = newLine;
    }, 2500); // Rotate every 2.5 seconds

    return () => clearInterval(intervalId);
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text && !isWaiting) return;

    if (isWaiting) {
        stopGeneration();
        return;
    }

    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl) welcomeEl.remove();

    appendMessageDOM("user", text);
    conversationHistory.push({ role: "user", content: text });
    updateChatTitle(activeChatId, text);
    saveCurrentChat();

    userInput.value = "";
    userInput.style.height = "auto";

    const aiRow = createMessageRow("ai", "");
    const bodyEl = aiRow.querySelector(".msg-body");
    // Removed simple .typing class addition

    isWaiting = true;
    updateSendButtonState("stop");
    renderSuggestions();

    abortController = new AbortController();
    const signal = abortController.signal;

    let fullResponse = "";
    const queue = [];
    let isStreamDone = false;
    let isTyping = false;
    let streamError = null;

    // Start Thinking Animation
    const stopThinking = startThinking(bodyEl);
    let isFirstChunk = true;

    const typeChar = () => {
        if (queue.length > 0) {
            // On first actual character type, ensure thinking UI is gone
            if (isFirstChunk) {
                stopThinking();
                bodyEl.innerHTML = ""; // Clear thinking container
                isFirstChunk = false;
            }

            isTyping = true;
            const chunkSize = queue.length > 100 ? 5 : queue.length > 20 ? 2 : 1;
            fullResponse += queue.splice(0, chunkSize).join("");

            bodyEl.innerHTML = marked.parse(fullResponse);
            bodyEl.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
            scrollToBottom();
            setTimeout(typeChar, 20);
            return;
        }

        if (isStreamDone) {
            // If stream finished but we never got content (empty response?)
            if (isFirstChunk) {
                stopThinking();
                bodyEl.innerHTML = "";
            }

            isTyping = false;
            // bodyEl.classList.remove("typing"); // No longer needed

            if (streamError && streamError.name !== "AbortError") {
                const isRateLimit = streamError.message.includes("rate limit exceeded temporarily");
                const prefix = isRateLimit ? "" : "Error: ";
                let errorHtml = `<div class="error-text">${prefix}${streamError.message}`;
                
                if (isRateLimit) {
                    errorHtml += `<button class="error-action-btn" onclick="openSidebar(); localStorage.setItem('veyogpt-sidebar-collapsed', 'false');">Open Side Panel</button>`;
                }
                
                errorHtml += `</div>`;
                bodyEl.innerHTML += errorHtml;
            }

            if (fullResponse) {
                conversationHistory.push({ role: "assistant", content: fullResponse });
                saveCurrentChat();
            }

            isWaiting = false;
            abortController = null;
            updateSendButtonState("send");
            userInput.focus();
            renderSuggestions();
        } else {
            isTyping = false;
        }
    };

    try {
        await streamAIResponse(text, signal, (chunk) => {
            queue.push(...chunk.split(""));
            if (!isTyping) typeChar();
        });
        isStreamDone = true;
        if (!isTyping) typeChar();
    } catch (err) {
        streamError = err;
        isStreamDone = true;
        if (!isTyping) typeChar();
    }
}

function stopGeneration() {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
}

function updateSendButtonState(state) {
    if (state === "stop") {
        sendBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>`;
        sendBtn.classList.add("stop-btn");
        sendBtn.setAttribute("aria-label", "Stop generating");
    } else {
        sendBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
            </svg>`;
        sendBtn.classList.remove("stop-btn");
        sendBtn.setAttribute("aria-label", "Send message");
    }
}

// ───── Stream AI Response ─────
async function streamAIResponse(userMessage, signal, onChunk) {
    const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
    ];

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": window.location.href,
            "X-Title": "VeyoGPT",
        },
        body: JSON.stringify({
            model: getSelectedModel(),
            messages: messages,
            stream: true,
        }),
        signal: signal,
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error("AI rate limit exceeded temporarily. Please change the agent model from the side panel or retry after sometime.");
        }
        const errorBody = await response.text();
        throw new Error(`API returned ${response.status}: ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
                try {
                    const json = JSON.parse(trimmed.substring(6));
                    if (json.choices?.[0]?.delta?.content) {
                        onChunk(json.choices[0].delta.content);
                    }
                } catch (e) {
                    console.error("Stream parse error", e);
                }
            }
        }
    }
}

// ───── DOM Helpers ─────
function createMessageRow(type, text, index) {
    const row = document.createElement("div");
    row.className = `message-row ${type}`;
    if (index !== undefined) row.dataset.index = index;

    if (type === "user") {
        // User: No avatar, just content (bubble) + Actions
        row.innerHTML = `
            <div class="msg-content">
                <div class="msg-body">${escapeHtml(text)}</div>
            </div>
            <div class="msg-actions">
                <button class="action-btn" title="Edit" onclick="editMessage(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn" title="Copy" onclick="copyMessage(this)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>`;
    } else {
        // AI: Content only (Avatar removed)
        row.innerHTML = `
            <div class="msg-content">
                <div class="msg-label">VeyoGPT</div>
                <div class="msg-body"></div>
            </div>`;
    }

    chatContainer.appendChild(row);
    scrollToBottom();
    return row;
}

function appendMessageDOM(type, text, index) {
    const row = createMessageRow(type, text, index);
    if (type === "ai" && text) {
        const body = row.querySelector(".msg-body");
        body.innerHTML = marked.parse(text);
        body.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
    }
    return row;
}

function copyMessage(btn) {
    const row = btn.closest(".message-row");
    const text = row.querySelector(".msg-body").innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
            btn.innerHTML = originalIcon;
        }, 2000);
    });
}

function editMessage(index) {
    if (index === undefined || index < 0 || index >= conversationHistory.length) return;
    
    // Get the message content
    const msg = conversationHistory[index];
    if (msg.role !== "user") return;

    // Populate input
    if (userInput) {
        userInput.value = msg.content;
        userInput.focus();
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
    }

    // Truncate history up to this point (exclusive)
    // If we edit index 2, we keep 0 and 1.
    conversationHistory = conversationHistory.slice(0, index);
    
    // Re-render UI
    renderChatUI();
}

function scrollToBottom() {
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

function escapeHtml(str) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return str.replace(/[&<>"']/g, (c) => map[c]);
}

// ───── Loading Screen ─────
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500); // Wait for transition
        }, 3000); // 1.5s fill + 1.5s empty = 3s total
    }
});
