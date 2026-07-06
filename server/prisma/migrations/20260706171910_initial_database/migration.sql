-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couples" (
    "id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "couples_invite_code_key" ON "couples"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "couples_user_a_id_key" ON "couples"("user_a_id");

-- CreateIndex
CREATE UNIQUE INDEX "couples_user_b_id_key" ON "couples"("user_b_id");

-- AddForeignKey
ALTER TABLE "couples" ADD CONSTRAINT "couples_user_a_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couples" ADD CONSTRAINT "couples_user_b_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
