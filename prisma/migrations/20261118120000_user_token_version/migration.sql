-- Goes up by one when the password changes or is reset. A login token carries the number it
-- was issued with, so tokens from before the change stop working on every device.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
