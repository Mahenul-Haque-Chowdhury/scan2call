export const QrFrameStyle = {
  NONE: 'NONE',
  SCAN2CALL_TOP: 'SCAN2CALL_TOP',
  SCAN2CALL_BOTTOM: 'SCAN2CALL_BOTTOM',
} as const;

export type QrFrameStyle = (typeof QrFrameStyle)[keyof typeof QrFrameStyle];

export const DEFAULT_QR_FRAME_STYLE: QrFrameStyle = QrFrameStyle.SCAN2CALL_TOP;

export const QR_FRAME_STYLE_VALUES = Object.values(QrFrameStyle);
