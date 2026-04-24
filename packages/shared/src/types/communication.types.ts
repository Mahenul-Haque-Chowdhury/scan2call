export interface CommunicationLogSummary {
  id: string;
  tagId: string;
  tagLabel: string | null;
  type: string;
  status: string;
  durationSeconds: number | null;
  initiatedAt: string;
}

export interface CommunicationLogDetail extends CommunicationLogSummary {
  proxyNumber: string | null;
  messageCount: number | null;
  connectedAt: string | null;
  endedAt: string | null;
}
