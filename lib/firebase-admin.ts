import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin';

// Define Firebase service account credentials for authentication
// These credentials allow secure access to Firebase services
const serviceAccount: ServiceAccount = {
  projectId: "homework-helper-7f100",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKCOP9MzKzpAfj\nwKDwx5FDQ0sEgAFvYmP9lFarXyN15NimkTKNFix9op+QDV+AC58EZztBkzFSWQR7\nnYJEf8Pqzf1eb1bKD20Viu2FQQWeiBpYsiwdgXLAafxVXSB2lQu40DIEH/vvjBSA\n+8qH/wUsAf8C/vzxzWlgJyshBEbbB5WGmeOICU5O1xSttwtKJ8jqhaVyMgnavX/0\nYkUWPAgNhGpF/Kw/6+EIk0EGbIKCt+jojojbTd7qW0G1gViEMiOE4kKnc5M/XS1x\nKGqBe0DmNVLTVeW54ITm7OsabyxHNEJqHer8H+4YGsa+gjOg+bey/VUA2qDXasxF\nVAXYsAuxAgMBAAECggEAXkuf/YFz3JxmgkpZ04eRqQ8zaDpGcTI+8Q/XE80nw9K3\nu6ZxLaB3y3undZiIRj8mTOvRoF2O25xolzmAn2/yhRj3dKgKnextQWzCRzt93+wu\nP8+I/4x3fo75Eu6QREh0XCHv9jTnZXq/5yOd97NzOoMD/uX8MO9qi1I8swBIAdnG\nlKNHaVrU6jC5/0WTgyI9IlBOWXAS9SuYZ7TQQPOEa2R9O+5qTdKC5My4caZRsbmD\n5SYwr2KhAAF6PQEo4OsuzlqPVw3tdBf/ox3Ukgy905Mr3wq3oYfx3099/YoHL3n6\nZminkM/b5xcUNt1ZZQ0TzrCWc+U9B+DGLjQ6i28xcQKBgQD/qhUfxABfMBukmzyv\nnIwZUVYNsXYtaVdmfMY7Qh94eWismEQnc5kokpe8XMkbL+b9jf1ACrtxy5IbjZ5+\nwZr0ObN/UKtrjCqJIbDxel9WnqoJReK3869WIuR/4DrF5ixGMvnV6hvHGV6Sfr0s\nXgh+ztuJr8L+u/pI805XYhfi5wKBgQDKTMkXWly1XQT8Tt/Wbtt1LRN3ZjmH+Dk6\nFHCea0NQ4omsvFHb512pXlE+LGCFjZM9puDHArFsQuMKpnfoo9ul22QT+NWTPskX\nLZNUEelD5S4GR0KUv3d9YFwiZ+agWVJbFiPujzE05ZoydWMSbDuAO6NXYZliDlW2\nyItzNiLhpwKBgQDXnLLv9TZzEHlfmuPVHmswtt2h8rW9modxEW2EcEFmMs3KMSfZ\nNa5G/0okOwQHf6CI2YRozCRE1e/EeOzf7ZsmuLredkP7EVyWBenZ3OAmhuzToTKQ\n/Fw0gny+M3adi35vPXJhq2v9vzF4zpXvouX7O6z+M1J5zkJH35mELGAEpQKBgGF8\nAQdE3xnyej2PUKQHha+AijnmQ+D2x7TqNp7Qd37Zu5hGo3fBlUvRjHrWbajN4V87\nNGQSMydFUB1IvM2ZcHYLM73AEkNDZSnLJ4zCmNLD9JrH6hi97zm2no9h3Cv2/w2v\nrJ7/16ly3wxjrtso1r9jfcHU4VH0MG/FUhWxx7tPAoGBAPu6I8tFQuoTtnYerj8m\nnmPJqs/dDtOwlQTHeTR738tD5ZA1+ghX4/IiJFWc9NKa7BmTjg4Os8patg6MklYG\n+aAmr48C1/kYlhSGarhv8tsvjWKFi1ag/pr8KqPClLUec+Yx+PyONHsr1mEhk+yw\nGghgcNQcxkOK2AX4F4dEye9f\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-qnrao@homework-helper-7f100.iam.gserviceaccount.com"
};

// Check if Firebase app is already initialized to prevent duplicate initialization
// This ensures the app is only initialized once during the application lifecycle
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount) // Use service account credentials to authenticate the Firebase app
  });
}

// Create and export a Firestore database instance for use across the application
export const db = getFirestore(); 