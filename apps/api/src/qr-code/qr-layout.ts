export const QrLayout = {
  STANDARD: 'STANDARD',
  WINDSHIELD_CARD: 'WINDSHIELD_CARD',
} as const;

export type QrLayout = (typeof QrLayout)[keyof typeof QrLayout];

export const DEFAULT_QR_LAYOUT: QrLayout = QrLayout.STANDARD;

export const QR_LAYOUT_VALUES = Object.values(QrLayout);
