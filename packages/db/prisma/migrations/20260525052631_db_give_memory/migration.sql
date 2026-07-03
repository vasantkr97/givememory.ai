-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Sender" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('openai', 'openrouter');

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender" "Sender" NOT NULL,
    "message_text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "memory_text" TEXT NOT NULL,
    "category" VARCHAR(64),
    "embedding" vector(1536),
    "memory_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_episodic" BOOLEAN NOT NULL DEFAULT false,
    "occurred_at" TIMESTAMP(3),
    "session_id" INTEGER,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_summary" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "summary_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "llm_provider" "LlmProvider" NOT NULL DEFAULT 'openai',
    "openai_api_key" TEXT,
    "openrouter_api_key" TEXT,
    "llm_model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "embedding_model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "debug" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_conversation_id_timestamp_idx" ON "messages"("conversation_id", "timestamp");

-- CreateIndex
CREATE INDEX "memories_conversation_id_is_active_idx" ON "memories"("conversation_id", "is_active");

-- CreateIndex
CREATE INDEX "memories_conversation_id_is_episodic_idx" ON "memories"("conversation_id", "is_episodic");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_summary_conversation_id_key" ON "conversation_summary"("conversation_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_summary" ADD CONSTRAINT "conversation_summary_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
