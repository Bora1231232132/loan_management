import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Controller('health')
export class HealthController {
  constructor(private database: DatabaseService) {}

  @Get('firestore')
  async testFirestore(): Promise<HealthResponseDto> {
    const db = this.database.getDb();

    const ref = await db.collection('connection_test').add({
      message: 'Firestore connected successfully',
      createdAt: new Date(),
    });

    const doc = await ref.get();

    return {
      success: true,
      documentId: ref.id,
      data: doc.data() as { message: string; createdAt: Date },
    };
  }
}
