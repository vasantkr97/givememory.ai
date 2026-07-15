-- A product user has one private conversation. PostgreSQL still permits
-- multiple NULL values so standalone SDK/CLI conversations remain supported.
CREATE UNIQUE INDEX "conversations_user_id_key" ON "conversations"("user_id");
