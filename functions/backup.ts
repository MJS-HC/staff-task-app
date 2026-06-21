import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";

admin.initializeApp();

const db = admin.firestore();
const storage = new Storage();

/**
 * Daily Firestore backup function
 * Runs every day at 2:00 AM UTC
 * Exports entire Firestore database to Cloud Storage
 */
export const dailyBackup = functions.pubsub
  .schedule("0 2 * * *") // Every day at 2:00 AM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const bucketName = `${projectId}-firestore-backups`;
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const backupPath = `firestore-backup-${timestamp}`;

      console.log(`Starting Firestore backup to gs://${bucketName}/${backupPath}`);

      // Export Firestore to Cloud Storage
      const client = new admin.firestore.v1.FirestoreAdminClient();

      const databaseName = client.databasePath(projectId, "(default)");

      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: `gs://${bucketName}/${backupPath}`,
        collectionIds: [],
      });

      const operationName = responses[0].name;
      console.log(`Backup operation started: ${operationName}`);

      // Optional: Cleanup old backups (older than 30 days)
      await cleanupOldBackups(bucketName, 30);

      console.log("Firestore backup completed successfully");
      return { success: true, backupPath };
    } catch (error) {
      console.error("Backup failed:", error);
      throw error;
    }
  });

/**
 * Cleanup old backups older than specified days
 */
async function cleanupOldBackups(bucketName: string, retentionDays: number) {
  try {
    const bucket = storage.bucket(bucketName);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [files] = await bucket.getFiles();

    for (const file of files) {
      const metadata = await file.getMetadata();
      const timeCreated = new Date(metadata[0].timeCreated);

      if (timeCreated < cutoffDate) {
        await file.delete();
        console.log(`Deleted old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.warn("Cleanup failed (non-critical):", error);
  }
}

/**
 * Manual backup trigger (call via HTTPS)
 * Allows on-demand backups
 */
export const triggerBackupManual = functions.https.onCall(
  async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    // Optional: Check if user is admin
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can trigger backups"
      );
    }

    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const bucketName = `${projectId}-firestore-backups`;
      const timestamp = new Date().toISOString();
      const backupPath = `firestore-backup-manual-${timestamp.replace(/:/g, "-")}`;

      const client = new admin.firestore.v1.FirestoreAdminClient();
      const databaseName = client.databasePath(projectId, "(default)");

      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: `gs://${bucketName}/${backupPath}`,
        collectionIds: [],
      });

      return {
        success: true,
        message: "Backup triggered successfully",
        backupPath,
        operationName: responses[0].name,
      };
    } catch (error) {
      console.error("Manual backup failed:", error);
      throw new functions.https.HttpsError("internal", "Backup failed");
    }
  }
);
