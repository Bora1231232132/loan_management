import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DatabaseService } from '../../database/database.service';
import type { Firestore } from 'firebase-admin/firestore';

interface MockCollection {
  add: jest.Mock;
}

interface MockDocRef {
  id: string;
  get: jest.Mock;
}

describe('HealthController', () => {
  let controller: HealthController;
  let mockDb: Partial<Firestore>;
  let mockCollection: MockCollection;
  let mockDocRef: MockDocRef;
  let mockDoc: { get: jest.Mock };
  let getDbMock: jest.Mock;

  beforeEach(async () => {
    // Mock document data
    const mockData = {
      message: 'Firestore connected successfully',
      createdAt: new Date(),
    };

    // Mock document snapshot
    mockDoc = {
      get: jest.fn().mockResolvedValue({
        data: () => mockData,
      }),
    };

    // Mock document reference
    mockDocRef = {
      id: 'test-doc-id-123',
      get: jest.fn().mockResolvedValue(mockDoc),
    };

    // Mock collection
    mockCollection = {
      add: jest.fn().mockResolvedValue(mockDocRef),
    };

    // Mock Firestore database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    // Mock DatabaseService
    getDbMock = jest.fn().mockReturnValue(mockDb);
    const mockDatabaseService = {
      getDb: getDbMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('testFirestore', () => {
    it('should create a document and return success response', async () => {
      const result = await controller.testFirestore();

      expect(getDbMock).toHaveBeenCalled();
      expect(mockDb.collection).toHaveBeenCalledWith('connection_test');
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Firestore connected successfully',
          createdAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({
        success: true,
        documentId: 'test-doc-id-123',
        data: {
          message: 'Firestore connected successfully',
          createdAt: expect.any(Date),
        },
      });
    });
  });
});
