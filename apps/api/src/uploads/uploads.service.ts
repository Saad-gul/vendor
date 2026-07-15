import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly localUrl: string;

  constructor(private readonly config: ConfigService) {
    this.localUrl = this.config.get('API_URL') || 'http://localhost:4000';
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    if (cloudName) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: this.config.get('CLOUDINARY_API_KEY'),
        api_secret: this.config.get('CLOUDINARY_API_SECRET'),
      });
    }
  }

  async upload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    if (this.config.get('CLOUDINARY_CLOUD_NAME')) {
      return this.uploadToCloudinary(file);
    }

    return this.uploadLocal(file);
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'marketverse' }, (err, result) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url });
      }).end(file.buffer);
    });
  }

  private uploadLocal(file: Express.Multer.File): { url: string } {
    // In production, integrate S3/Cloudinary. This is a dev fallback only.
    this.logger.warn('Cloudinary/S3 not configured; returning placeholder URL');
    return { url: `${this.localUrl}/uploads/${file.originalname}` };
  }
}
