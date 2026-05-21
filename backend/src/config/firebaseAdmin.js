const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  } else {
    firebaseApp = admin.initializeApp({ projectId });
  }

  return firebaseApp;
};

const verifyFirebaseToken = async (idToken) => {
  const app = initializeFirebaseAdmin();
  if (!app) {
    throw new Error('Firebase Admin is not configured — set FIREBASE_PROJECT_ID');
  }
  return admin.auth().verifyIdToken(idToken);
};

module.exports = { verifyFirebaseToken };
