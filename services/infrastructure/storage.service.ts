import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export class StorageService {
  /**
   * Generates a signed URL for secure file upload/download.
   * Prevents public access to sensitive project documents.
   */
  static async getSignedUrl(documentId: string, userId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!doc) throw new ApiError(404, "Không tìm thấy tài liệu");

    // In production, we would call S3/Supabase Storage here.
    // For now, we simulate a signed URL with a temporary token.
    const token = Buffer.from(`${documentId}:${userId}:${Date.now() + 3600000}`).toString('base64');
    
    return {
      url: `${doc.url}?token=${token}`,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * Securely saves a new document version with virus scanning simulation.
   */
  static async saveDocument(data: {
    projectId: string;
    name: string;
    url: string;
    type: string;
    userId: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    // 1. Virus Scanning (Simulated)
    const isSafe = await this.scanForViruses(data.url);
    if (!isSafe) throw new ApiError(400, "Tài liệu chứa mã độc hoặc rủi ro bảo mật");

    // 2. Metadata Extraction & Storage
    return prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          url: data.url,
          type: data.type,
          uploadedById: data.userId,
          sourceType: data.sourceType,
          sourceId: data.sourceId
        }
      });

      return document;
    });
  }

  private static async scanForViruses(url: string): Promise<boolean> {
    // Simulate API call to ClamAV or similar
    return true;
  }
}
