"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDailyQuestions = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Reset daily questions at midnight every day
exports.resetDailyQuestions = functions.pubsub
    .schedule('0 0 * * *') // Run at midnight every day (UTC)
    .timeZone('UTC')
    .onRun(async (context) => {
    const db = admin.firestore();
    const batch = db.batch();
    // Get all users with active subscriptions
    const usersSnapshot = await db
        .collection('users')
        .where('subscription.status', '==', 'active')
        .get();
    // Reset questionsUsed to 0 for all active subscriptions
    usersSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
            'subscription.questionsUsed': 0
        });
    });
    await batch.commit();
    console.log(`Reset daily questions for ${usersSnapshot.size} users`);
    return null;
});
//# sourceMappingURL=index.js.map