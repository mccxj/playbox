/**
 * Default configuration for the AI API Gateway Worker
 */

import { Provider } from '../types/provider';

export interface Config {
  providers: Provider;
  default_provider: string;
}

export const DEFAULT_CONFIG: Config = {
  providers: {
    ollama: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://ollama.com',
      key: 'Ollama',
      models: ['glm-5.1', 'glm-4.7', 'kimi-k2.6', 'minimax-m2.7', 'glm-5', 'qwen3-vl:235b', 'qwen3.5:397b'],
    },
    longcat: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://api.longcat.chat/openai',
      key: 'LongCat',
      models: ['LongCat-Flash-Chat', 'LongCat-Flash-Lite', 'LongCat-Flash-Thinking', 'LongCat-Pro-Preview'],
    },
    longcat_claude: {
      type: 'anthropic',
      family: 'anthropic',
      endpoint: 'https://api.longcat.chat/anthropic',
      key: 'LongCat',
      models: ['LongCat-Flash-Chat', 'LongCat-Flash-Lite', 'LongCat-Flash-Thinking', 'LongCat-Pro-Preview'],
      authType: 'bearer',
    },
    cerebras: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://api.cerebras.ai',
      key: 'Cerebras',
      models: ['qwen-3-235b-a22b-instruct-2507'],
      modelAliases: {
        qwen3: 'qwen-3-235b-a22b-instruct-2507',
      },
    },
    gemini: {
      type: 'google',
      family: 'gemini',
      endpoint: 'https://generativelanguage.googleapis.com',
      key: 'Gemini',
      models: [
        'gemini-flash-latest',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash-lite',
        'gemma-4-31b-it',
      ],
    },
    // 'gemini-cli': {
    //   type: 'gemini-cli',
    //   family: 'gemini',
    //   endpoint: 'https://cloudcode-pa.googleapis.com/v1internal',
    //   key: 'Gemini',
    //   models: ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    // },
    modelscope: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://api-inference.modelscope.cn',
      key: 'ModelScope',
      models: [
        'deepseek-ai/DeepSeek-V3.2',
        'MiniMax/MiniMax-M2.5',
        'MiniMax/MiniMax-M2.7',
        'moonshotai/Kimi-K2.5',
        'Qwen/Qwen3.5-397B-A17B',
        'Qwen/Qwen3.5-35B-A3B',
        'Qwen/Qwen3.5-27B',
        'Qwen/Qwen3.5-122B-A10B',
        'ZhipuAI/GLM-5',
        'ZhipuAI/GLM-5.1',
        'ZhipuAI/GLM-4.7-Flash',
      ],
    },
    nvidia: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://integrate.api.nvidia.com',
      key: 'Nvidia',
      models: [
        'z-ai/glm4.7',
        'z-ai/glm5',
        'z-ai/glm-5.1',
        'qwen/qwen3-coder-480b-a35b-instruct',
        'qwen/qwen3.5-397b-a17b',
        'qwen/qwen3.5-122b-a10b',
        'google/gemma-4-31b-it',
        'minimaxai/minimax-m2.5',
        'minimaxai/minimax-m2.7',
        'moonshotai/kimi-k2.5',
        'nvidia/nemotron-3-super-120b-a12b',
      ],
    },
    doubao: {
      type: 'openai',
      family: 'openai',
      endpoint: 'https://ark.cn-beijing.volces.com/api/coding/v3',
      key: 'Doubao',
      models: ['ark-code-latest'],
    },
    cloudflare: {
      type: 'worker',
      family: 'openai',
      endpoint: 'https://api.cloudflare.com',
      key: 'Cloudflare',
      models: ['@cf/moonshotai/kimi-k2.6'],
    },
  },
  default_provider: 'longcat',
};
