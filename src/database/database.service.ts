import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { existsSync } from 'fs';
import type { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class DatabaseService {
  private db: Firestore;

  constructor(private config: ConfigService) {
    const path = this.config.get<string>('firebase.serviceAccountPath');
    const projectId = this.config.get<string>('firebase.projectId');

    if (!path || !projectId) {
      throw new Error('Firebase env variables missing');
    }

    if (!existsSync(path)) {
      throw new Error('Service account JSON not found');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(path),
        projectId,
      });
    }

    this.db = admin.firestore();
  }

  getDb(): Firestore {
    return this.db;
  }
}
