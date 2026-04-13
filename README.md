# Playbox - AI API Gateway & Protocol Converter

AI API Gateway & Protocol Converter — converts between AI provider protocols (OpenAI, Anthropic, Google, Gemini CLI) on Next.js.

## Overview

Playbox is a Next.js-based API gateway that translates between different AI provider protocols. It allows you to use a single API endpoint to interact with multiple AI providers, handling protocol conversion, authentication, and token management automatically.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js
- **Language**: TypeScript
- **Testing**: Vitest
- **Deployment**: Cloudflare Workers (via Wrangler)

## Project Structure

```
./
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── v1/           # API endpoints
│   │   │   ├── models/   # Model listing
│   │   │   ├── chat/     # Chat completions
│   │   │   └── messages/ # Messages API
│   │   └── health/      # Health check
│   └── layout.tsx        # Root layout
├── src/
│   ├── protocols/         # Protocol adapters (OpenAI, Anthropic, Google, Gemini CLI)
│   ├── config/            # Configuration management
│   ├── utils/             # Utilities (logger, SSE parser, constants)
│   ├── lib/               # Shared libraries
│   └── types/             # TypeScript type definitions
├── test/                  # Vitest tests
├── public/                # Static assets
├── wrangler.jsonc         # Cloudflare Workers config
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies & scripts
```

## Features

- **Multi-protocol Support**: OpenAI, Anthropic, Google, Gemini CLI formats
- **Protocol Conversion**: Automatic translation between provider protocols
- **Authentication**: API key verification and management
- **Token Caching**: KV-based caching for access tokens with automatic refresh
- **CORS Support**: Configurable CORS headers for cross-origin requests
- **Health Checks**: Built-in health check endpoint

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy
```

### Configuration

Configuration is managed through environment variables and `wrangler.jsonc`:

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your API keys and settings
```

## API Endpoints

### Health Check
```
GET /api/health
```

### List Models
```
GET /api/v1/models
```

### Chat Completions
```
POST /api/v1/chat/completions
```

### Messages API
```
POST /api/v1/messages
```

## Protocol Support

### OpenAI
- Chat Completions API
- Models API
- Streaming support

### Anthropic
- Messages API
- Streaming support

### Google
- Chat API
- Streaming support

### Gemini CLI
- OAuth-based authentication
- Token caching in KV
- Automatic token refresh

## Development

### Adding a New Protocol

1. Create a new protocol adapter in `src/protocols/`
2. Follow the pattern in `base.ts`
3. Export a `createXProtocol()` factory function
4. Register in `src/protocols/index.ts`

### Adding a New API Route

1. Create a new route in `app/api/`
2. Use Next.js App Router conventions
3. Import protocol adapters from `src/protocols/`
4. Handle authentication and protocol conversion

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Deployment

### Local Development

```bash
npm run dev
```

### Cloudflare Workers

```bash
# Deploy to Cloudflare
npm run deploy

# Preview deployment
npm run preview
```

## Documentation

- [Migration Guide](./MIGRATION.md) - Migration from Cloudflare Workers to Next.js
- [AGENTS.md](./AGENTS.md) - Project knowledge base for AI agents

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
