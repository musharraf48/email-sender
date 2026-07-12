-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "companyName" TEXT,
    "jobType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "sendError" TEXT,
    "recruiterName" TEXT,
    "jobTitle" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "salary" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_email_idx" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Application_domain_idx" ON "Application"("domain");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_appliedAt_idx" ON "Application"("appliedAt");

-- CreateIndex
CREATE INDEX "Application_expiresAt_idx" ON "Application"("expiresAt");
