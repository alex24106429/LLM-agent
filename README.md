# LLM Agent

A lightweight, extensible command-line LLM agent built with Node.js and TypeScript. It features a REPL interface, automatic tool execution, and out-of-the-box support for file system manipulation, web searching, running system commands, and more.

It can be easily configured to work with **any OpenAI-compatible API**, including OpenRouter, Gemini, and local models (via llama.cpp, LM Studio, Ollama, etc).

## Prerequisites

- [Node.js](https://nodejs.org/en/download)
- A LLM provider (and optionally Brave Search for web access)

## Setup

1. **Clone the repository.**
   ```bash
   git clone https://github.com/alex24106429/LLM-agent
   ```
2. **Create your config file:**
   Copy the example configuration file to create your own:
   ```bash
   cp config.example.json config.json
   ```
3. **Configure your API keys** in `config.json` (see Configuration below).

## Install Dependencies

```bash
npm install
```

## Running the Agent

```bash
npm run dev
```

Type your prompt into the REPL, or type `exit` to quit.

---

## Configuration (Providers & Models)

The agent reads from `config.json`. You can easily switch between API providers by modifying the `OPENAI_BASE_URL` and `OPENAI_MODEL` fields.

**1. Using Gemini (Has a free tier)**

[Get your free API key here](https://aistudio.google.com/api-keys)

```json
{
  "OPENAI_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai/",
  "OPENAI_MODEL": "gemini-3.5-flash",
  "OPENAI_API_KEY": "...",
  "BRAVE_API_KEY": "..."
}
```

**2. Using OpenRouter**

[Find free models here](https://openrouter.ai/models?output_modalities=text&max_price=0&order=most-popular)

```json
{
  "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
  "OPENAI_MODEL": "google/gemma-4-26b-a4b-it:free",
  "OPENAI_API_KEY": "...",
  "BRAVE_API_KEY": "..."
}
```

**3. Using Local Models (llama.cpp recommended)**

[Get llama.cpp here](https://github.com/ggml-org/llama.cpp/releases/latest).

[Find models here](https://huggingface.co/models?num_parameters=min:0,max:9B&apps=llama.cpp&sort=trending&search=unsloth%2F)
*([Qwen3.5](https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf) and [Gemma 4](https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf) are recommended).*

Run llama.cpp server:

```bash
llama-server -c 16384 -m "Qwen3.5-4B-Q4_K_M.gguf" -np 1 --no-mmap -ctk q8_0 -ctv q8_0
```

Example config:

```json
{
  "OPENAI_BASE_URL": "http://localhost:8080/v1",
  "OPENAI_MODEL": "",
  "OPENAI_API_KEY": "not-needed",
  "BRAVE_API_KEY": "..."
}
```


---

## Built-in Tools

The agent comes with several powerful tools out of the box:
- **File System**: `read_file`, `write_file`, `delete_file`, `list_files`, `make_directory`
- **System**: `run_command`
- **Utility**: `read_pdf` (extracts text from local PDFs or URLs)
- **Web**: `search_web` (Requires a [Brave Search API Key](https://brave.com/search/api/) in `config.json`)

---

## Making Tools

The agent dynamically loads tools from the `src/tools/default/` and `src/tools/user/` directories. To create a custom tool, simply create a new `.ts` file in that folder and export an object that satisfies the `Tool` interface.

Here is an example of a custom tool that fetches a mock temperature (`src/tools/user/getTemperature.ts`):

```typescript
import { Tool } from "../../types.ts";

export default {
    definition: {
        type: 'function',
        function: {
            name: 'get_temperature',
            description: 'Get the current temperature for a specific city.',
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: 'The city to get the weather for (e.g., "London", "Tokyo").',
                    }
                },
                required: ['city'],
                additionalProperties: false,
            },
            strict: true
        },
    },
    execute: async (args: { city: string }) => {
        console.log(`\n[System] Fetching weather for: ${args.city}`);

        // You can add real API calls here!
        const mockTemp = Math.floor(Math.random() * 30);

        return `The current temperature in ${args.city} is ${mockTemp}°C.`;
    }
} satisfies Tool;
```

### Tool Guidelines:
1. **Definition**: Must match the standard OpenAI `ChatCompletionTool` schema. Setting `strict: true` is highly recommended for structured outputs.
2. **Execute Function**: Takes the parsed JSON arguments from the LLM and must return a `string` (or a `Promise<string>`).
