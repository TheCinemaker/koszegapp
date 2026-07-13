// src/pages/VisitPointer/Signaling.js
import { supabase } from '../../lib/supabaseClient';

export class VisitPointerSignaling {
  constructor(sessionId, role, onSignal, onStatusChange, onDisplayReady) {
    this.sessionId = sessionId;
    this.role = role; // 'display' or 'phone'
    this.onSignal = onSignal;
    this.onStatusChange = onStatusChange;
    this.onDisplayReady = onDisplayReady; // phone uses this to know when to send offer
    this.channelName = `visitpointer:${sessionId}`;
    this.channel = null;
  }

  connect() {
    this.channel = supabase.channel(this.channelName);

    this.channel
      // Main signaling messages (offer, answer, candidate, busy)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.sender !== this.role) {
          this.onSignal(payload.data);
        }
      })
      // Display announces it is ready — phone waits for this before sending offer
      .on('broadcast', { event: 'display_ready' }, ({ payload }) => {
        if (this.role === 'phone' && this.onDisplayReady) {
          this.onDisplayReady();
        }
      })
      .subscribe((status) => {
        if (this.onStatusChange) {
          this.onStatusChange(status);
        }
      });
  }

  send(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        sender: this.role,
        data: data
      }
    });
  }

  // Display calls this to announce it is ready to accept an offer
  announceReady() {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'display_ready',
      payload: { sender: this.role }
    });
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
