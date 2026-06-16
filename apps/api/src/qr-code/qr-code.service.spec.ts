import { QrCodeService } from './qr-code.service';
import { QrFrameStyle } from './qr-frame-style';
import { QrLayout } from './qr-layout';

describe('QrCodeService framed assets', () => {
  const service = new QrCodeService({
    appUrl: 'https://scan2call.test',
  } as never);

  const extractOverlaySvg = (svg: string) => {
    const match = svg.match(/href="data:image\/svg\+xml;base64,([^"]+)"/);
    const encodedOverlay = match?.[1];
    expect(encodedOverlay).toBeDefined();
    return Buffer.from(encodedOverlay as string, 'base64').toString('utf-8');
  };

  it('renders the standard frame with brand accent, black QR background marker, and rounded inset border', async () => {
    const svg = await service.generateSvgWithOptions('https://scan2call.test/scan/SAMPLE123456', {
      frameStyle: QrFrameStyle.SCAN2CALL_TOP,
      qrLayout: QrLayout.STANDARD,
    });
    const overlaySvg = extractOverlaySvg(svg);

    expect(overlaySvg).toContain('Scan');
    expect(overlaySvg).toContain('Call');
    expect(overlaySvg).toContain('Scan The QR Code');
    expect(overlaySvg).toContain('To Contact The Owner');
    expect(overlaySvg).toContain('fill="#FACC15"');
    expect(overlaySvg).toContain('stroke="#FACC15"');
    expect(overlaySvg).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="\d+" rx="\d+" fill="none" stroke="#FACC15" stroke-width="2" \/>/);
    expect(svg).toContain('data:image/png;base64,');
  });

  it('renders the windshield card with matching brand accent, black QR background marker, and inset border', async () => {
    const svg = await service.generateSvgWithOptions('https://scan2call.test/scan/SAMPLE123456', {
      frameStyle: QrFrameStyle.SCAN2CALL_TOP,
      qrLayout: QrLayout.WINDSHIELD_CARD,
    });
    const overlaySvg = extractOverlaySvg(svg);

    expect(overlaySvg).toContain('Scan The QR Code To');
    expect(overlaySvg).toContain('Contact The Owner');
    expect(overlaySvg).toContain('fill="#FACC15"');
    expect(overlaySvg).toContain('fill="#000000"');
    expect(overlaySvg).toContain('stroke="#FACC15"');
    expect(overlaySvg).toContain('rx="28"');
    expect(svg).toContain('data:image/png;base64,');
  });

  it('renders passport sticker horizontal with the horizontal card composition', async () => {
    const svg = await service.generateSvgWithOptions('https://scan2call.test/scan/SAMPLE123456', {
      frameStyle: QrFrameStyle.SCAN2CALL_TOP,
      qrLayout: QrLayout.PASSPORT_STICKER_HORIZONTAL,
    });
    const overlaySvg = extractOverlaySvg(svg);

    expect(overlaySvg).toContain('viewBox="0 0 1000 421"');
    expect(overlaySvg).toContain('Scan The QR Code To');
    expect(overlaySvg).toContain('stroke="#FACC15"');
  });

  it('renders passport sticker vertical with the portrait frame composition', async () => {
    const svg = await service.generateSvgWithOptions('https://scan2call.test/scan/SAMPLE123456', {
      frameStyle: QrFrameStyle.SCAN2CALL_TOP,
      qrLayout: QrLayout.PASSPORT_STICKER_VERTICAL,
    });
    const overlaySvg = extractOverlaySvg(svg);

    expect(overlaySvg).toContain('Scan The QR Code');
    expect(overlaySvg).toContain('To Contact The Owner');
    expect(overlaySvg).toContain('stroke="#FACC15"');
    expect(overlaySvg).not.toContain('viewBox="0 0 1000 421"');
  });
});
