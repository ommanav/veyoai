// VeyoGPT Configuration
// Replace with your OpenRouter API key from https://openrouter.ai/keys
const OPENROUTER_API_KEY = "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";

// OpenRouter API endpoint
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Available models (free tier)
const AVAILABLE_MODELS = [
    { id: "openrouter/free", name: "OpenRouter Free" },
    { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1" },
    { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B" },
    { id: "openai/gpt-oss-20b:free", name: "GPT-OSS 20B" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "LLaMA 3.3 70B" },
    { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder" },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B" },
    { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
    { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large" },
    { id: "arcee-ai/trinity-mini:free", name: "Trinity Mini" },
    { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash" },
    { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air" },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 30B" },
    { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron 9B" },
    { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron 12B VL" },
];

// Default model
const DEFAULT_MODEL = "openrouter/free";
