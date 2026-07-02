export type MessageRole = "user" | "assistant";

export type LlmProvider = "openai" | "openrouter";

export type MemoryKind = "semantic" | "bubble" | "connected";

export type ToolAction = "ADD" | "UPDATE" | "DELETE" | "REPLACE" | "NOOP";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface BubbleCandidate {
  text: string;
  importance: number;
}

export interface ExtractionResult {
  semantic: string[];
  bubbles: BubbleCandidate[];
}

export interface ToolDecision {
  action: ToolAction;
  memoryId: number | null;
  text: string | null;
}

export interface MemorySearchResult {
  memoryId: number;
  memory: string;
  type: MemoryKind;
  occurredAt: string | null;
  score: number;
  connections: number[];
}

export interface MemorySearchResponse {
  query: string;
  total: number;
  results: MemorySearchResult[];
}

export interface ProviderSettings {
  llmProvider: LlmProvider;
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
  llmModel: string;
  embeddingModel: string;
  debug: boolean;
}

export interface PublicProviderSettings {
  llmProvider: LlmProvider;
  hasOpenaiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  llmModel: string;
  embeddingModel: string;
  debug: boolean;
}

export interface UsageInfo {
  free_messages_remaining: number;
  free_message_limit: number;
  message_count: number;
  has_api_key: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  usage: UsageInfo;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface ApiKeyStatus {
  has_key: boolean;
  is_valid: boolean;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  message: string;
}

export interface ExtractedMemory {
  id: number;
  local_id: number;
  text: string;
  type: "semantic" | "bubble";
}

export interface ProductChatResponse {
  response: string;
  extracted_memories: {
    semantic: ExtractedMemory[];
    bubbles: ExtractedMemory[];
  };
  relevant_memories: MemorySearchResult[];
  usage: UsageInfo;
}

export interface ChatHistoryMessage {
  id: number;
  role: MessageRole;
  content: string;
  extracted_memories: {
    semantic?: ExtractedMemory[];
    bubbles?: ExtractedMemory[];
  } | null;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  total: number;
  has_more: boolean;
}

export interface MemoryNode {
  id: number;
  local_id: number;
  text: string;
  type: "semantic" | "bubble";
  importance: number;
  created_at: string;
  connections: Array<{
    target_id: number;
    target_global_id: number;
    score: number;
  }>;
}

export interface MemoryLink {
  source: number;
  target: number;
  source_local: number;
  target_local: number;
  strength: number;
}

export interface MemoriesResponse {
  nodes: MemoryNode[];
  links: MemoryLink[];
  id_mapping: Record<number, number>;
}

export interface MemoryDetail {
  id: number;
  local_id: number;
  text: string;
  type: "semantic" | "bubble";
  importance: number;
  created_at: string;
  occurred_at: string | null;
  connected_memories: Array<{
    id: number;
    local_id: number;
    text: string;
    type: "semantic" | "bubble";
    score: number;
    created_at: string;
  }>;
}
