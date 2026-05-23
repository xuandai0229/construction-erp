import { prisma } from "@/lib/prisma";
import { LoggerService } from "./logger.service";
import fs from 'fs/promises';
import path from 'path';

export class StorageService {
  private static UPLOAD_DIR = path.join(process.cwd(), 'uploads');

  static async init() {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static async uploadFile(file: Buffer, fileName: string, metadata: { projectId: string, uploadedById: string, sourceType?: string, sourceId?: string }) {
    await this.init();
    
    const fileId = crypto.randomUUID();
    const extension = path.extname(fileName);
    const storedName = `${fileId}${extension}`;
    const filePath = path.join(this.UPLOAD_DIR, storedName);

    await fs.writeFile(filePath, file);

    const doc = await prisma.document.create({
      data: {
        id: fileId,
        projectId: metadata.projectId,
        name: fileName,
        url: `/uploads/${storedName}`,
        type: extension.replace('.', ''),
        size: file.length,
        sourceType: metadata.sourceType,
        sourceId: metadata.sourceId,
        uploadedById: metadata.uploadedById,
        updatedAt: new Date(),
      }
    });

    LoggerService.info("File uploaded", { fileId, fileName, size: file.length });
    return doc;
  }
}
