import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class QrCodeService {
  constructor(private readonly config: AppConfigService) {}

  buildScanUrl(token: string): string {
    return `${this.config.appUrl}/scan/${token}`;
  }

  async generatePng(url: string, size = 300): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      width: size,
      errorCorrectionLevel: 'H',
      margin: 2,
    });
  }

  async generateSvg(url: string): Promise<string> {
    return QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
    });
  }

  async generateDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      width: 200,
      errorCorrectionLevel: 'H',
      margin: 2,
    });
  }
}
