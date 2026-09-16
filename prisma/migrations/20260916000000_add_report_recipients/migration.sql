-- Report recipients are a mailing list and deliberately have no relation to user accounts.
CREATE TABLE "report_recipients" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_recipients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_recipients_email_key" ON "report_recipients"("email");
