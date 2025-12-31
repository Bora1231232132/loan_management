import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Controller('test-firestore')
export class TestController {
  constructor(private firebase: DatabaseService) {}

  @Get()
  async testFirestore() {
    const db = this.firebase.getDb();

    const ref = await db.collection('connection_test').add({
      message: 'Firestore connected successfully',
      createdAt: new Date(),
    });

    const doc = await ref.get();

    return {
      success: true,
      documentId: ref.id,
      data: doc.data(),
    };
  }
}
