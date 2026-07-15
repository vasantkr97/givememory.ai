# TypeScript Migration Map

This file maps the original Python project into the new TypeScript implementation.

No Python source is copied into `new_project`. The old Python code remains only in the original root project. The new project is implemented with Bun, TypeScript, Express, React, Prisma, PostgreSQL, and pgvector.

## Source Mapping

| Old Python file | New TypeScript implementation |
| --- | --- |
| `src/givememory/core/settings.py` | `packages/db/src/stores/providerSettingsStore.ts`, `apps/api/src/routes/settingsRoutes.ts` |
| `src/givememory/core/openai_client.py` | `packages/core/src/llm/llmClient.ts` |
| `src/givememory/db/database.py` | `packages/db/src/client.ts`, `packages/db/prisma/schema.prisma` |
| `src/givememory/db/models/conversation.py` | `packages/db/prisma/schema.prisma`, `packages/db/src/stores/conversationStore.ts` |
| `src/givememory/db/models/message.py` | `packages/db/prisma/schema.prisma`, `packages/db/src/stores/messageStore.ts` |
| `src/givememory/db/models/memory.py` | `packages/db/prisma/schema.prisma`, `packages/db/src/stores/memoryStore.ts` |
| `src/givememory/db/models/conversation_summary.py` | `packages/db/prisma/schema.prisma`, `packages/db/src/stores/summaryStore.ts` |
| `src/givememory/memory/memory.py` | `packages/core/src/memory/contextMemory.ts`, `packages/core/src/chat/chatService.ts` |
| `src/givememory/memory/extractor.py` | `packages/core/src/memory/extractor.ts` |
| `src/givememory/memory/tool_classifier.py` | `packages/core/src/memory/toolClassifier.ts` |
| `src/givememory/memory/embeddings.py` | `packages/core/src/embeddings/embedText.ts` |
| `src/givememory/memory/similar_memory_search.py` | `packages/core/src/memory/similarMemorySearch.ts` |
| `src/givememory/memory/similarity.py` | Replaced by pgvector cosine search in `packages/core/src/vector/vectorStore.ts` |
| `src/givememory/memory/vector_store.py` | `packages/core/src/vector/vectorStore.ts` |
| `src/givememory/memory/bubble_creator.py` | `packages/core/src/memory/bubbleCreator.ts` |
| `src/givememory/memory/connection_finder.py` | `packages/core/src/memory/connectionFinder.ts` |
| `src/givememory/memory/add/add_extraction_phase.py` | `packages/core/src/memory/contextMemory.ts`, `packages/core/src/memory/extractor.ts` |
| `src/givememory/memory/add/add_updation_phase.py` | `packages/core/src/memory/updatePhase.ts` |
| `src/givememory/summary/summary_generator.py` | `packages/core/src/summary/summaryGenerator.ts` |
| `src/givememory/utils/extraction_system_prompt.py` | `packages/core/src/prompts/extractionPrompt.ts` |
| `src/givememory/utils/tool_call_system_prompt.py` | `packages/core/src/prompts/toolClassifierPrompt.ts` |
| `src/givememory/utils/summary_generator_prompt.py` | `packages/core/src/prompts/summaryPrompt.ts` |
| `src/givememory/__init__.py` | `packages/core/src/index.ts` |
| `main.py` | `apps/api/src/cli.ts`, React dashboard at `/dashboard` |
| `test.py` | Manual API/UI test flow in `README.md` and automated Bun tests under `packages/db/tests` |
| `README.md` | `new_project/README.md` |
| `pyproject.toml`, `requirements.txt`, `MANIFEST.in` | Replaced by Bun workspace `package.json` files |

## Implemented In TypeScript

- Conversation/message/memory/summary schema
- Provider settings
- OpenAI/OpenRouter client
- Embeddings
- Memory extraction
- Tool classification
- Add/update/replace/noop memory flow
- Semantic memories
- Episodic bubbles
- Bubble connections
- Conversation summaries
- pgvector search
- Chat service
- Express REST API
- React dashboard
- Landing page
- Docs, demo, sign-in, sign-up, and protected dashboard routes
- Old-style CLI demo: `bun run chat`
- Authentication, encrypted API keys, security headers, request limits, and centralized error handling
- Admin-only provider settings screen at `/settings`
- Ownership checks that isolate each user's conversation and memories

## Intentional Changes

- FAISS local index files were replaced with PostgreSQL `pgvector`.
- SQLite fallback is not active because this version targets Neon/PostgreSQL.
- Provider settings are persisted in PostgreSQL and editable in the React UI.
- The dashboard lives at `/dashboard`; the marketing landing page lives at `/`.
- The product frontend from `test-context-memory/web` was ported to Vite React using local Next.js compatibility shims.

## Deployment-Specific Optional Work

- Add a data import script if an existing old SQLite/PostgreSQL database must be moved.
- Reintroduce SQLite fallback only if local non-Postgres mode is required.
- Use a shared rate-limit store if the API is deployed as multiple instances.
- Move browser tokens to secure HTTP-only cookies if the frontend and API deployment topology supports them.
- Add deployment infrastructure such as a production process manager, HTTPS termination, monitoring, and backups.
