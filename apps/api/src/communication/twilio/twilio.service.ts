import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { validateRequest } from 'twilio';

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio.Twilio | null = null;
  private proxyServiceSid: string;

  // Twilio credentials
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private twimlAppSid: string;
  private apiKeySid: string;
  private apiKeySecret: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.phoneNumber = this.config.get<string>('TWILIO_PHONE_NUMBER', '');
    this.proxyServiceSid = this.config.get<string>('TWILIO_PROXY_SERVICE_SID', '');
    this.twimlAppSid = this.config.get<string>('TWILIO_TWIML_APP_SID', '');
    this.apiKeySid = this.config.get<string>('TWILIO_API_KEY_SID', '');
    this.apiKeySecret = this.config.get<string>('TWILIO_API_KEY_SECRET', '');

    if (this.accountSid && this.authToken) {
      this.client = Twilio(this.accountSid, this.authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured - communication features disabled');
    }
  }

  private get twilioClient(): Twilio.Twilio {
    if (!this.client) throw new BadRequestException('Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    return this.client;
  }

  private parseTwilioError(err: unknown): string {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.message === 'string') {
        // Twilio errors have a numeric `code` and human-readable `message`
        const code = typeof e.code === 'number' ? ` (code ${e.code})` : '';
        return `${e.message}${code}`;
      }
    }
    return 'Twilio request failed. Please try again.';
  }

  /**
   * Create a Twilio Proxy session with short TTL for anonymous relay.
   * Returns the session SID and the proxy phone number.
   */
  async createProxySession(
    ownerPhone: string,
    finderPhone: string,
    ttlMinutes = 15,
  ): Promise<{ sessionSid: string; proxyNumber: string }> {
    this.logger.log('Creating Twilio Proxy session');

    // Create a new proxy session with a short TTL
    const session = await this.twilioClient.proxy.v1
      .services(this.proxyServiceSid)
      .sessions.create({
        uniqueName: `scan2call-${Date.now()}`,
        ttl: ttlMinutes * 60, // Convert to seconds
        mode: 'voice-and-message',
      });

    // Add the tag owner as the first participant
    const ownerParticipant = await this.twilioClient.proxy.v1
      .services(this.proxyServiceSid)
      .sessions(session.sid)
      .participants.create({
        friendlyName: 'Owner',
        identifier: ownerPhone,
      });

    // Add the finder as the second participant
    await this.twilioClient.proxy.v1
      .services(this.proxyServiceSid)
      .sessions(session.sid)
      .participants.create({
        friendlyName: 'Finder',
        identifier: finderPhone,
      });

    this.logger.log(`Proxy session created: ${session.sid}`);

    return {
      sessionSid: session.sid,
      proxyNumber: ownerParticipant.proxyIdentifier,
    };
  }

  /**
   * Close a proxy session (end the anonymous relay).
   */
  async closeProxySession(sessionSid: string): Promise<void> {
    try {
      await this.twilioClient.proxy.v1
        .services(this.proxyServiceSid)
        .sessions(sessionSid)
        .update({ status: 'closed' });

      this.logger.log(`Proxy session closed: ${sessionSid}`);
    } catch (error) {
      this.logger.warn(`Failed to close proxy session ${sessionSid}: ${error}`);
    }
  }

  /**
   * Generate a Twilio Client access token for browser-based calls.
   * Uses API Key (not Account SID) as recommended by Twilio.
   */
  generateClientToken(identity: string): string {
    if (!this.accountSid) {
      throw new BadRequestException('Twilio is not configured. Set TWILIO_ACCOUNT_SID.');
    }
    if (!this.apiKeySid || !this.apiKeySecret) {
      throw new BadRequestException(
        'Twilio voice is not configured. Set TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET.',
      );
    }
    if (!this.twimlAppSid) {
      throw new BadRequestException(
        'Twilio voice is not configured. Set TWILIO_TWIML_APP_SID.',
      );
    }

    try {
      const AccessToken = Twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: this.twimlAppSid,
        incomingAllow: false,
      });

      const token = new AccessToken(
        this.accountSid,
        this.apiKeySid,
        this.apiKeySecret,
        { identity, ttl: 3600 },
      );

      token.addGrant(voiceGrant);
      return token.toJwt();
    } catch (err) {
      this.logger.error('Failed to generate Twilio client token', err);
      throw new BadRequestException(`Failed to generate call token: ${this.parseTwilioError(err)}`);
    }
  }

  /**
   * Send a direct SMS via Twilio.
   */
  async sendSms(to: string, body: string): Promise<string> {
    if (!this.client) {
      this.logger.warn(`[DEV SMS] To: ${to}, Body: ${body}`);
      return 'dev-message-sid';
    }
    if (!this.phoneNumber) {
      throw new BadRequestException('Twilio SMS is not configured. Set TWILIO_PHONE_NUMBER.');
    }
    try {
      const message = await this.client.messages.create({ to, from: this.phoneNumber, body });
      return message.sid;
    } catch (err) {
      this.logger.error(`Twilio SMS failed to ${to}`, err);
      throw new BadRequestException(`Failed to send SMS: ${this.parseTwilioError(err)}`);
    }
  }

  /**
   * Send a WhatsApp message via Twilio.
   */
  async sendWhatsAppMessage(to: string, body: string): Promise<string> {
    const whatsappFrom = this.config.get<string>(
      'TWILIO_WHATSAPP_NUMBER',
      'whatsapp:+14155238886',
    );

    try {
      const message = await this.twilioClient.messages.create({
        body,
        from: `whatsapp:${whatsappFrom.replace('whatsapp:', '')}`,
        to: `whatsapp:${to.replace('whatsapp:', '')}`,
      });
      this.logger.log(`WhatsApp message sent: ${message.sid}`);
      return message.sid;
    } catch (err) {
      this.logger.error(`Twilio WhatsApp failed to ${to}`, err);
      throw new BadRequestException(`Failed to send WhatsApp message: ${this.parseTwilioError(err)}`);
    }
  }

  /**
   * Validate a Twilio webhook request signature.
   */
  validateWebhook(signature: string, url: string, params: Record<string, string>): boolean {
    return validateRequest(this.authToken, signature, url, params);
  }

  /**
   * Get details of a specific call by SID.
   */
  async getCallDetails(callSid: string) {
    return this.twilioClient.calls(callSid).fetch();
  }

  /**
   * Get details of a specific message by SID.
   */
  async getMessageDetails(messageSid: string) {
    return this.twilioClient.messages(messageSid).fetch();
  }
}

