import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import { AppConfigService } from '../config/config.service';

export interface QrRenderOptions {
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  layout?: 'STANDARD' | 'BRANDED_4X6';
  layoutWidth?: number;
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
    if (options.layout === 'BRANDED_4X6') {
      return this.generateBrandedPngWithOptions(url, options);
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
    if (options.layout === 'BRANDED_4X6') {
      return this.generateBrandedSvgWithOptions(url, options);
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

  private getBrandedLayout(options: QrRenderOptions) {
    const baseSize = options.size ?? 300;
    const layoutWidth = options.layoutWidth ?? Math.round(baseSize * 4);
    const layoutHeight = Math.round(layoutWidth * 1.5);
    const panelWidth = Math.round(layoutWidth * 0.74);
    const panelHeight = panelWidth;
    const panelX = Math.round((layoutWidth - panelWidth) / 2);
    const panelY = Math.round(layoutHeight * 0.18);
    const qrPadding = Math.round(panelWidth * 0.1);
    const qrSize = panelWidth - qrPadding * 2;

    return {
      layoutWidth,
      layoutHeight,
      panelWidth,
      panelHeight,
      panelX,
      panelY,
      qrSize,
      qrX: panelX + qrPadding,
      qrY: panelY + qrPadding,
      panelRadius: Math.round(layoutWidth * 0.06),
      brandFontSize: Math.round(layoutWidth * 0.085),
      footerFontSize: Math.round(layoutWidth * 0.055),
      brandY: Math.round(layoutHeight * 0.12),
      footerY: Math.round(layoutHeight * 0.83),
    };
  }

  private buildBrandedPatternSvg(layout: ReturnType<QrCodeService['getBrandedLayout']>) {
    const patternSize = Math.round(layout.layoutWidth * 0.09);
    const dropSize = Math.round(patternSize * 0.45);
    const radius = Math.max(4, Math.round(dropSize * 0.35));
    const patternColor = '#EAB308';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.layoutWidth}" height="${layout.layoutHeight}" viewBox="0 0 ${layout.layoutWidth} ${layout.layoutHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="droplets" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <path d="M${dropSize * 0.5} 0 C ${dropSize * 0.85} ${dropSize * 0.4}, ${dropSize * 0.95} ${dropSize * 0.75}, ${dropSize * 0.5} ${dropSize} C ${dropSize * 0.05} ${dropSize * 0.75}, ${dropSize * 0.15} ${dropSize * 0.4}, ${dropSize * 0.5} 0 Z" fill="${patternColor}" opacity="0.25" />
      <circle cx="${dropSize * 0.15}" cy="${dropSize * 0.2}" r="${radius}" fill="${patternColor}" opacity="0.18" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#droplets)" />
</svg>`;
  }

  private buildBrandedOverlaySvg(layout: ReturnType<QrCodeService['getBrandedLayout']>, options: QrRenderOptions) {
    const fontFamily = '"Space Grotesk", "Space Grotesk Fallback", system-ui, sans-serif';
    const textColor = '#111111';
    const accent = '#FACC15';
    const panelColor = options.backgroundColor ?? '#FFFFFF';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.layoutWidth}" height="${layout.layoutHeight}" viewBox="0 0 ${layout.layoutWidth} ${layout.layoutHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${layout.panelX}" y="${layout.panelY}" width="${layout.panelWidth}" height="${layout.panelHeight}" rx="${layout.panelRadius}" fill="${panelColor}" />
  <text x="50%" y="${layout.brandY}" text-anchor="middle" dominant-baseline="middle" font-family=${fontFamily} font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">
    <tspan>Scan</tspan><tspan fill="${accent}">2</tspan><tspan>Call</tspan>
  </text>
  <text x="50%" y="${layout.footerY}" text-anchor="middle" dominant-baseline="middle" font-family=${fontFamily} font-size="${layout.footerFontSize}" font-weight="600" fill="${textColor}">
    Scan The QR Code To Contact The Owner
  </text>
</svg>`;
  }

  private async generateBrandedPngWithOptions(url: string, options: QrRenderOptions = {}): Promise<Buffer> {
    const layout = this.getBrandedLayout(options);
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#0f172a',
        light: options.backgroundColor ?? '#ffffff',
      },
    });

    const base = sharp({
      create: {
        width: layout.layoutWidth,
        height: layout.layoutHeight,
        channels: 4,
        background: '#FACC15',
      },
    });

    const patternSvg = this.buildBrandedPatternSvg(layout);
    const overlaySvg = this.buildBrandedOverlaySvg(layout, options);

    return base
      .composite([
        { input: Buffer.from(patternSvg) },
        { input: Buffer.from(overlaySvg) },
        { input: qrBuffer, top: layout.qrY, left: layout.qrX },
      ])
      .png()
      .toBuffer();
  }

  private async generateBrandedSvgWithOptions(url: string, options: QrRenderOptions = {}): Promise<string> {
    const layout = this.getBrandedLayout(options);
    const qrBuffer = await QRCode.toBuffer(url, {
      width: layout.qrSize,
      errorCorrectionLevel: 'H',
      margin: options.margin ?? 2,
      color: {
        dark: options.foregroundColor ?? '#0f172a',
        light: options.backgroundColor ?? '#ffffff',
      },
    });

    const fontFamily = '"Space Grotesk", "Space Grotesk Fallback", system-ui, sans-serif';
    const textColor = '#111111';
    const accent = '#FACC15';
    const panelColor = options.backgroundColor ?? '#FFFFFF';
    const patternSize = Math.round(layout.layoutWidth * 0.09);
    const dropSize = Math.round(patternSize * 0.45);
    const radius = Math.max(4, Math.round(dropSize * 0.35));

    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${layout.layoutWidth}" height="${layout.layoutHeight}" viewBox="0 0 ${layout.layoutWidth} ${layout.layoutHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="droplets" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <path d="M${dropSize * 0.5} 0 C ${dropSize * 0.85} ${dropSize * 0.4}, ${dropSize * 0.95} ${dropSize * 0.75}, ${dropSize * 0.5} ${dropSize} C ${dropSize * 0.05} ${dropSize * 0.75}, ${dropSize * 0.15} ${dropSize * 0.4}, ${dropSize * 0.5} 0 Z" fill="#EAB308" opacity="0.25" />
      <circle cx="${dropSize * 0.15}" cy="${dropSize * 0.2}" r="${radius}" fill="#EAB308" opacity="0.18" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#FACC15" />
  <rect width="100%" height="100%" fill="url(#droplets)" />
  <rect x="${layout.panelX}" y="${layout.panelY}" width="${layout.panelWidth}" height="${layout.panelHeight}" rx="${layout.panelRadius}" fill="${panelColor}" />
  <image x="${layout.qrX}" y="${layout.qrY}" width="${layout.qrSize}" height="${layout.qrSize}" href="${qrDataUrl}" />
  <text x="50%" y="${layout.brandY}" text-anchor="middle" dominant-baseline="middle" font-family=${fontFamily} font-size="${layout.brandFontSize}" font-weight="700" fill="${textColor}">
    <tspan>Scan</tspan><tspan fill="${accent}">2</tspan><tspan>Call</tspan>
  </text>
  <text x="50%" y="${layout.footerY}" text-anchor="middle" dominant-baseline="middle" font-family=${fontFamily} font-size="${layout.footerFontSize}" font-weight="600" fill="${textColor}">
    Scan The QR Code To Contact The Owner
  </text>
</svg>`;
  }
}
