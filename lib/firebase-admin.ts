import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 환경변수가 필요합니다."
    );
  }

  _app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount),
  });

  return _app;
}

export function getDb(): Firestore {
  if (_db) return _db;
  getFirebaseApp();
  _db = getFirestore();
  return _db;
}
