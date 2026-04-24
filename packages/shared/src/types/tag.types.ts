import type { TagType, TagStatus } from '../constants/tag-types';

export interface TagSummary {
  id: string;
  token: string;
  type: TagType;
  status: TagStatus;
  label: string | null;
  photoUrl: string | null;
  isLostMode: boolean;
  scanCount: number;
  createdAt: string;
}

export interface TagDetail extends TagSummary {
  description: string | null;
  lostModeAt: string | null;
  lostModeMessage: string | null;
  allowVoiceCall: boolean;
  allowSms: boolean;
  allowWhatsApp: boolean;
  allowSendLocation: boolean;
  activatedAt: string | null;
  updatedAt: string;
}

// Public scan page data - NO owner PII
export interface PublicTagInfo {
  tagType: TagType;
  label: string | null;
  description: string | null;
  ownerFirstName: string;
  isLostMode: boolean;
  lostModeMessage: string | null;
  photoUrl: string | null;
  contactOptions: {
    call: boolean;
    sms: boolean;
    whatsapp: boolean;
    browserCall: boolean;
    sendLocation: boolean;
  };
}
