-- DropIndex
DROP INDEX "Permission_roleId_action_subject_key";

-- CreateIndex
CREATE INDEX "Permission_roleId_idx" ON "Permission"("roleId");

-- CreateIndex
CREATE INDEX "Post_ownerId_id_idx" ON "Post"("ownerId", "id");
