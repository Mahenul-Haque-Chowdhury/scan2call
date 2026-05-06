import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import { AppConfigService } from '../config/config.service';
import { QrFrameStyle } from './qr-frame-style';

export interface QrRenderOptions {
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  frameStyle?: QrFrameStyle;
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
    if (options.frameStyle && options.frameStyle !== QrFrameStyle.NONE) {
      return this.generateFramedPngWithOptions(url, options.frameStyle, options);
    }
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
    if (options.frameStyle && options.frameStyle !== QrFrameStyle.NONE) {
      return this.generateFramedSvgWithOptions(url, options.frameStyle, options);
    }
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

  private getFrameLayout(options: QrRenderOptions) {
    const qrSize = options.size ?? 320;
    const padding = Math.round(qrSize * 0.12);
    const topTextHeight = Math.round(qrSize * 0.22);
    const bottomTextHeight = Math.round(qrSize * 0.22);
    const frameWidth = qrSize + padding * 2;
    const frameHeight = topTextHeight + bottomTextHeight + qrSize + padding * 2;

    return {
      frameWidth,
      frameHeight,
      qrSize,
      padding,
      topTextHeight,
      bottomTextHeight,
      qrX: padding,
      qrY: topTextHeight + padding,
      radius: Math.round(frameWidth * 0.08),
      brandFontSize: Math.round(qrSize * 0.16),
      detailFontSize: Math.round(qrSize * 0.085),
      topTextY: Math.round(padding * 0.7 + topTextHeight / 2),
      bottomTextY: Math.round(topTextHeight + padding + qrSize + padding + bottomTextHeight / 2),
    };
  }

  private buildFrameOverlaySvg(
    layout: ReturnType<QrCodeService['getFrameLayout']>,
    frameStyle: QrFrameStyle,
  ) {
    const fontFamily = '"Space Grotesk", "Space Grotesk Fallback", system-ui, sans-serif';
    const textColor = '#111111';
    const accent = '#FACC15';
    const borderColor = '#E2E8F0';
    const background = '#FFFFFF';

    const brandText = (y: number) => `
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">
    <tspan fill="${textColor}">Scan</tspan><tspan fill="${accent}">2</tspan><tspan fill="${textColor}">Call</tspan>
  </text>`;
    const detailText = (y: number) => `
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${layout.detailFontSize}" font-weight="600" fill="${textColor}">
    Scan The QR Code To Contact The Owner
  </text>`;

    const topIsBrand = frameStyle === QrFrameStyle.SCAN2CALL_TOP;
    const topText = topIsBrand
      ? brandText(layout.topTextY)
      : detailText(layout.topTextY);
    const bottomText = topIsBrand
      ? detailText(layout.bottomTextY)
      : brandText(layout.bottomTextY);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.frameWidth}" height="${layout.frameHeight}" viewBox="0 0 ${layout.frameWidth} ${layout.frameHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${layout.frameWidth}" height="${layout.frameHeight}" rx="${layout.radius}" fill="${background}" stroke="${borderColor}" stroke-width="2" />
  ${topText}
  ${bottomText}
</svg>`;
  }

  private async generateFramedPngWithOptions(
    url: string,
    frameStyle: QrFrameStyle,
    options: QrRenderOptions = {},
  ): Promise<Buffer> {
    const layout = this.getFrameLayout(options);
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#111111',
        light: options.backgroundColor ?? '#FFFFFF',
      },
    });

    const base = sharp({
      create: {
        width: layout.frameWidth,
        height: layout.frameHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const overlaySvg = this.buildFrameOverlaySvg(layout, frameStyle);

    return base
      .composite([
        { input: Buffer.from(overlaySvg) },
        { input: qrBuffer, top: layout.qrY, left: layout.qrX },
      ])
      .png()
      .toBuffer();
  }

  private async generateFramedSvgWithOptions(
    url: string,
    frameStyle: QrFrameStyle,
    options: QrRenderOptions = {},
  ): Promise<string> {
    const layout = this.getFrameLayout(options);
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#111111',
        light: options.backgroundColor ?? '#FFFFFF',
      },
    });

    const overlaySvg = this.buildFrameOverlaySvg(layout, frameStyle);
    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.frameWidth}" height="${layout.frameHeight}" viewBox="0 0 ${layout.frameWidth} ${layout.frameHeight}" xmlns="http://www.w3.org/2000/svg">
  <image x="0" y="0" width="${layout.frameWidth}" height="${layout.frameHeight}" href="data:image/svg+xml;base64,${Buffer.from(overlaySvg).toString('base64')}" />
  <image x="${layout.qrX}" y="${layout.qrY}" width="${layout.qrSize}" height="${layout.qrSize}" href="${qrDataUrl}" />
</svg>`;
  }
}
