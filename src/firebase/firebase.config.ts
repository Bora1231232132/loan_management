// Firebase Client Configuration
// This is for client-side Firebase SDK (browser/mobile apps)
// For backend, use Firebase Admin SDK (see database.service.ts)

export const firebaseConfig = {
  apiKey: 'AIzaSyCquC1yXsEfWQY_By56DqyhHvi3tvOyzcU',
  authDomain: 'backend-27401.firebaseapp.com',
  projectId: 'backend-27401',
  storageBucket: 'backend-27401.firebasestorage.app',
  messagingSenderId: '304870522088',
  appId: '1:304870522088:web:b99bbf37869c16075f5d5d',
  measurementId: 'G-QK909G4Q90',
};

// Export as JSON string for easy use in HTML/test files
export const firebaseConfigJson = JSON.stringify(firebaseConfig, null, 2);
