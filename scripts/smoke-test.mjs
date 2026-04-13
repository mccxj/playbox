#!/usr/bin/env node
/**
 * Smoke Test - 验证生产环境关键接口可用性
 *
 * 测试端点:
 * - OpenAI: POST /v1/chat/completions
 * - Anthropic: POST /v1/messages
 * - Gemini: POST /v1beta/models/{model}:generateContent
 *
 * 用法: node scripts/smoke-test.mjs
 * 环境变量: BASE_URL (默认: https://airfly.dpdns.org)
 */

const BASE_URL = process.env.BASE_URL || 'https://airfly.dpdns.org';
const API_KEY = process.env.SMOKE_TEST_API_KEY || 'sk-1234';
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// 测试配置
const TESTS = [
  {
    name: 'OpenAI Chat Completions',
    method: 'POST',
    path: '/v1/chat/completions',
    body: {
      model: 'z-ai/glm5',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    },
    validate: (data) => {
      if (!data.choices || !Array.isArray(data.choices)) {
        return 'Missing or invalid choices array';
      }
      if (!data.choices[0]?.message?.content) {
        return 'Missing choices[0].message.content';
      }
      return null;
    },
  },
  {
    name: 'Anthropic Messages',
    method: 'POST',
    path: '/v1/messages',
    // 注意: 此端点要求 anthropic 系列模型，当前环境可能不支持
    // 如环境无 anthropic 模型，可通过环境变量 SMOKE_SKIP_ANTHROPIC=1 跳过
    skip: process.env.SMOKE_SKIP_ANTHROPIC === '1',
    body: {
      model: 'claude-3-5-haiku-latest', // 需要 anthropic 系列模型
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    },
    validate: (data) => {
      if (!data.content || !Array.isArray(data.content)) {
        return 'Missing or invalid content array';
      }
      if (!data.content[0]?.text) {
        return 'Missing content[0].text';
      }
      return null;
    },
  },
  {
    name: 'Gemini GenerateContent',
    method: 'POST',
    // 注意: 此端点要求 gemini 系列模型
    path: '/v1beta/models/gemini-2.5-flash:generateContent',
    body: {
      contents: [{ parts: [{ text: 'Hi' }] }],
      generationConfig: { maxOutputTokens: 1 },
    },
    validate: (data) => {
      if (!data.candidates || !Array.isArray(data.candidates)) {
        return 'Missing or invalid candidates array';
      }
      // Gemini 返回 candidates，但 finishReason=MAX_TOKENS 时可能无 parts
      // 验证基本结构存在即可
      if (!data.candidates[0]) {
        return 'Missing candidates[0]';
      }
      return null;
    },
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(data) {
  // 503 Service Unavailable, 429 Rate Limit
  return data?.error?.status === 'UNAVAILABLE' || 
         data?.error?.code === 503 ||
         data?.error?.code === 429;
}

async function runTest(test) {
  // 跳过标记的测试
  if (test.skip) {
    console.log(`\n⏭️  Skipped: ${test.name} (marked as skip)`);
    return { success: true, skipped: true };
  }

  const url = `${BASE_URL}${test.path}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      if (attempt === 1) {
        console.log(`\n🔍 Testing: ${test.name}`);
        console.log(`   URL: ${url}`);
      } else {
        console.log(`   🔄 Retry ${attempt}/${MAX_RETRIES}...`);
      }

      const response = await fetch(url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(test.body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`   ❌ Invalid JSON response: ${text.slice(0, 200)}`);
      return { success: false, error: 'Invalid JSON' };
    }

    // 检查是否为可重试错误（包括 HTTP 200 但 body 包含 error）
    if (isRetryableError(data) && attempt < MAX_RETRIES) {
      console.log(`   ⚠️  ${data.error?.message || 'Service unavailable'} (will retry)`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    // HTTP 错误
    if (!response.ok) {
      console.log(`   ❌ HTTP ${response.status}: ${text.slice(0, 200)}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    // 响应 body 包含 error（即使 HTTP 200）
    if (data?.error) {
      console.log(`   ❌ API Error: ${data.error.message || JSON.stringify(data.error)}`);
      return { success: false, error: data.error.code || 'API error' };
    }

    const validationError = test.validate(data);

      if (validationError) {
        console.log(`   ❌ Validation failed: ${validationError}`);
        console.log(`   Response: ${JSON.stringify(data).slice(0, 300)}`);
        return { success: false, error: validationError };
      }

      console.log(`   ✅ Passed`);
      return { success: true };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
      
      if (attempt < MAX_RETRIES) {
        console.log(`   ⚠️  ${errorMsg} (will retry)`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      
      console.log(`   ❌ Error: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

async function main() {
  console.log('========================================');
  console.log('Smoke Test - Production API Verification');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log(`Tests: ${TESTS.length}`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of TESTS) {
    const result = await runTest(test);
    if (result.skipped) {
      skipped++;
    } else if (result.success) {
      passed++;
    } else {
      failed++;
      console.log(`\n💥 Stopping on first failure (任一接口失败即退出)`);
      break;
    }
  }

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${skipped} skipped, ${failed} failed`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
