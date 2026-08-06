import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {
  ChatConversation,
  ChatMessage,
  ChatThreadResponse,
} from './chat.models';

/**
 * Real-time support chat between the shop owner and the platform admins.
 * The socket layer is browser-only so SSR renders never open a connection.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private socket: Socket | null = null;

  readonly messages = signal<ChatMessage[]>([]);
  readonly connected = signal(false);
  readonly unread = signal(0);
  readonly adminTyping = signal(false);

  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket) return;
    const token = this.auth.token();
    if (!token) return;

    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('message:new', (message: ChatMessage) =>
      this.onMessage(message),
    );
    this.socket.on('conversation:update', (conversation: ChatConversation) =>
      this.unread.set(conversation.unreadForShop ?? 0),
    );
    this.socket.on('typing', (payload: { role: string; isTyping: boolean }) => {
      if (payload.role === 'ADMIN') this.adminTyping.set(payload.isTyping);
    });
  }

  loadThread(): Observable<ChatThreadResponse> {
    return this.http
      .get<ChatThreadResponse>(`${environment.apiUrl}/wholesale/chat`)
      .pipe(
        tap((res) => {
          this.messages.set(res.messages ?? []);
          this.unread.set(0);
        }),
      );
  }

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Always use REST so web-push completes on Vercel serverless.
    // Sockets remain for live message:new / typing only.
    this.http
      .post<ChatMessage>(`${environment.apiUrl}/wholesale/chat`, {
        text: trimmed,
      })
      .subscribe({
        next: (message) => this.onMessage(message),
        error: (err) => console.error('[chat] send failed', err),
      });
  }

  markRead(): void {
    this.unread.set(0);
    if (this.socket && this.connected()) {
      this.socket.emit('conversation:read', {});
    }
  }

  /**
   * Tell the server whether the support thread is on screen so it can decide
   * to send a push notification (only when the thread is NOT being viewed).
   */
  setViewing(active: boolean): void {
    if (active) this.unread.set(0);
    this.socket?.emit('chat:view', { active });
  }

  notifyTyping(isTyping: boolean): void {
    if (this.socket && this.connected()) {
      this.socket.emit('typing', { isTyping });
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  private onMessage(message: ChatMessage): void {
    this.messages.update((list) =>
      list.some((m) => m.id === message.id) ? list : [...list, message],
    );
    if (message.senderRole === 'ADMIN') {
      this.adminTyping.set(false);
    }
    // Push notifications come from the server (web-push / inbox).
    // Do not show a second local Notification here — it has no click URL.
  }
}
