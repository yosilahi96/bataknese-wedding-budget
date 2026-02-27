-- CreateTable
CREATE TABLE "master_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);
