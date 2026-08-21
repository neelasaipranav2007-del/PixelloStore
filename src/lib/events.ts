import { EventEmitter } from "events";

class PortalEventEmitter extends EventEmitter {}

// Global event bus singleton across HMR reloads
const globalForEvents = global as unknown as { portalEvents: PortalEventEmitter };

export const portalEvents = globalForEvents.portalEvents || new PortalEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.portalEvents = portalEvents;
}
