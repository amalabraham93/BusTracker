const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let serviceAccount;
try {
    if (process.env.FIREBASE_CREDENTIALS) {
        // 1. Production Mode: Read from Environment Variable
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        logger.info('Firebase credentials loaded from environment variable.');
    } else {
        // 2. Local Development Mode: Read from ignored file
        const serviceAccountPath = 'C:\\Amal\\BusTracker\\track-school-bus-2026-firebase-adminsdk-fbsvc-1685114653.json';
        serviceAccount = require(serviceAccountPath);
        logger.info('Firebase credentials loaded from local JSON file.');
    }
} catch (error) {
    logger.error('Firebase Service Account Key not found. Push notifications will not work.');
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        logger.info('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        logger.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
}

module.exports = admin;
