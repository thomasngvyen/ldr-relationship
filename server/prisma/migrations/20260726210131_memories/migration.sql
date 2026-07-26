-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "couple_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "date_idea_id" TEXT,
    "title" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_images" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "caption" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memories_visit_id_key" ON "memories"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "memories_date_idea_id_key" ON "memories"("date_idea_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_couple_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_visit_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_date_idea_fkey" FOREIGN KEY ("date_idea_id") REFERENCES "date_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_images" ADD CONSTRAINT "memory_images_memory_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_images" ADD CONSTRAINT "memory_images_user_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
