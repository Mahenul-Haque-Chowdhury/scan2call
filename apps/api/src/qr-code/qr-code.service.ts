import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import { AppConfigService } from '../config/config.service';
import { QrFrameStyle } from './qr-frame-style';
import { QrLayout } from './qr-layout';

export interface QrRenderOptions {
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  frameStyle?: QrFrameStyle;
  qrLayout?: QrLayout;
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
    if (options.qrLayout === QrLayout.WINDSHIELD_CARD) {
      return this.generateWindshieldCardPng(url, options);
    }
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
    if (options.qrLayout === QrLayout.WINDSHIELD_CARD) {
      return this.generateWindshieldCardSvg(url, options);
    }
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
      brandFontSize: Math.round(qrSize * 0.18),
      detailFontSize: Math.round(qrSize * 0.09) + 1,
      topTextY: Math.round(padding * 0.7 + topTextHeight / 2) + Math.round(qrSize * 0.03),
      bottomTextY: Math.round(topTextHeight + padding + qrSize + padding + bottomTextHeight / 2) - Math.round(qrSize * 0.1),
    };
  }

  private getWindshieldLayout() {
    return {
      frameWidth: 1000,
      frameHeight: 421,
      qrSize: 374,
      qrX: 37,
      qrY: 24,
      brandY: 170,
      brandFontSize: 104,
      brandScanX: 421,
      brandTwoX: 694,
      brandCallX: 754,
      detailX: 428,
      detailLineOneY: 270,
      detailLineTwoY: 338,
      detailFontSize: 50,
    };
  }

  private buildFrameOverlaySvg(
    layout: ReturnType<QrCodeService['getFrameLayout']>,
    frameStyle: QrFrameStyle,
  ) {
    const fontFamily = "Space Grotesk, 'Space Grotesk Fallback', 'DejaVu Sans', system-ui, sans-serif";
    const textColor = '#111111';
    const accent = '#FACC15';
    const borderColor = '#E2E8F0';
    const background = '#FFFFFF';

    const escapeSvg = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const safeFontFamily = escapeSvg(fontFamily);
    const brandParts = {
      left: escapeSvg('Scan'),
      mid: escapeSvg('2'),
      right: escapeSvg('Call'),
    };
    const detailLineOne = escapeSvg('Scan The QR Code');
    const detailLineTwo = escapeSvg('To Contact The Owner');

    const brandText = (y: number) => `
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${safeFontFamily}" font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">
    <tspan fill="${textColor}">${brandParts.left}</tspan><tspan fill="${accent}">${brandParts.mid}</tspan><tspan fill="${textColor}">${brandParts.right}</tspan>
  </text>`;
    const detailText = (y: number) => `
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${safeFontFamily}" font-size="${layout.detailFontSize}" font-weight="600" fill="${textColor}">
    <tspan x="50%" dy="-${Math.round(layout.detailFontSize * 0.55)}">${detailLineOne}</tspan>
    <tspan x="50%" dy="${Math.round(layout.detailFontSize * 1.2)}">${detailLineTwo}</tspan>
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
        { input: Buffer.from(overlaySvg, 'utf-8') },
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

  private buildWindshieldTextSvg(layout: ReturnType<QrCodeService['getWindshieldLayout']>) {
    const fontFamily = "'Arial', 'Liberation Sans', 'DejaVu Sans', Helvetica, sans-serif";
    const textColor = '#111111';
    const qrColor = '#0B1424';
    const accent = '#FACC15';
    const background = '#FFFFFF';

    const escapeSvg = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const safeFontFamily = escapeSvg(fontFamily);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.frameWidth}" height="${layout.frameHeight}" viewBox="0 0 ${layout.frameWidth} ${layout.frameHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${layout.frameWidth}" height="${layout.frameHeight}" fill="${background}" />
  <text x="${layout.brandScanX}" y="${layout.brandY}" font-family="${safeFontFamily}" font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">Scan</text>
  <text x="${layout.brandTwoX}" y="${layout.brandY}" font-family="${safeFontFamily}" font-size="${layout.brandFontSize}" font-weight="700" fill="${accent}">2</text>
  <text x="${layout.brandCallX}" y="${layout.brandY}" font-family="${safeFontFamily}" font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">Call</text>
  <text x="${layout.detailX}" y="${layout.detailLineOneY}" font-family="${safeFontFamily}" font-size="${layout.detailFontSize}" font-weight="400" fill="${textColor}">Scan The QR Code To</text>
  <text x="${layout.detailX}" y="${layout.detailLineTwoY}" font-family="${safeFontFamily}" font-size="${layout.detailFontSize}" font-weight="400" fill="${textColor}">Contact The Owner</text>
  <rect x="-1" y="-1" width="1" height="1" fill="${qrColor}" opacity="0" />
</svg>`;
  }

  private async generateWindshieldCardPng(
    url: string,
    options: QrRenderOptions = {},
  ): Promise<Buffer> {
    const layout = this.getWindshieldLayout();
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 1,
      color: {
        dark: options.foregroundColor ?? '#0B1424',
        light: options.backgroundColor ?? '#FFFFFF',
      },
    });

    const base = sharp({
      create: {
        width: layout.frameWidth,
        height: layout.frameHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    const overlaySvg = this.buildWindshieldTextSvg(layout);

    return base
      .composite([
        { input: Buffer.from(overlaySvg, 'utf-8') },
        { input: qrBuffer, top: layout.qrY, left: layout.qrX },
      ])
      .png()
      .toBuffer();
  }

  private async generateWindshieldCardSvg(
    url: string,
    options: QrRenderOptions = {},
  ): Promise<string> {
    const layout = this.getWindshieldLayout();
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 1,
      color: {
        dark: options.foregroundColor ?? '#0B1424',
        light: options.backgroundColor ?? '#FFFFFF',
      },
    });
    const overlaySvg = this.buildWindshieldTextSvg(layout);
    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.frameWidth}" height="${layout.frameHeight}" viewBox="0 0 ${layout.frameWidth} ${layout.frameHeight}" xmlns="http://www.w3.org/2000/svg">
  <image x="0" y="0" width="${layout.frameWidth}" height="${layout.frameHeight}" href="data:image/svg+xml;base64,${Buffer.from(overlaySvg).toString('base64')}" />
  <image x="${layout.qrX}" y="${layout.qrY}" width="${layout.qrSize}" height="${layout.qrSize}" href="${qrDataUrl}" />
</svg>`;
  }
}
