import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { AppConfigService } from '../config/config.service';

export interface QrRenderOptions {
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
}

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

  async generatePngWithOptions(url: string, options: QrRenderOptions = {}): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      width: options.size ?? 300,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#0f172a',
        light: options.backgroundColor ?? '#ffffff',
      },
    });
  }

  async generateSvgWithOptions(url: string, options: QrRenderOptions = {}): Promise<string> {
    return QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#0f172a',
        light: options.backgroundColor ?? '#ffffff',
      },
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
