export class HealthResponseDto {
  success: boolean;
  documentId: string;
  data: {
    message: string;
    createdAt: Date;
  };
}
