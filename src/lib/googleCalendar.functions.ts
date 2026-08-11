import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";
import {
  saveConnectionKeyForUser,
  getConnectionKeyForUser,
  deleteConnectionForUser,
} from "./appUserConnections.server";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_calendar";
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => targetOrigin)
  .handler(async ({ data: targetOrigin, context }) => {
    const clientKey = process.env.GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY is not set");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: `${targetOrigin}/dashboard/settings`,
      responseMode: "web_message",
      webMessageTargetOrigin: targetOrigin,
      credentialsConfiguration: { scopes: SCOPES },
    });
    return { authorizationUrl };
  });

export const saveGoogleCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { connectionAPIKey: string }) => input)
  .handler(async ({ data, context }) => {
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.connectionAPIKey);
    return { ok: true };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: CONNECTOR_ID });
      } catch (e) {
        console.error("Gateway disconnect failed", e);
      }
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    return { connected: !!key };
  });

/** Return busy time ranges for the host from Google Calendar between timeMin and timeMax. */
export const getHostBusyTimes = createServerFn({ method: "POST" })
  .inputValidator((input: { hostUserId: string; timeMin: string; timeMax: string }) => input)
  .handler(async ({ data }) => {
    const key = await getConnectionKeyForUser(data.hostUserId, CONNECTOR_ID);
    if (!key) return { busy: [] as Array<{ start: string; end: string }> };
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/calendar/v3/freeBusy",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMin: data.timeMin,
          timeMax: data.timeMax,
          items: [{ id: "primary" }],
        }),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("freeBusy failed", res.status, text);
      return { busy: [] as Array<{ start: string; end: string }> };
    }
    const body = await res.json();
    const busy = body?.calendars?.primary?.busy ?? [];
    return { busy: busy as Array<{ start: string; end: string }> };
  });

/** Create a Google Calendar event on the host's primary calendar for a booking. */
export const createBookingEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      hostUserId: string;
      summary: string;
      description?: string;
      startISO: string;
      endISO: string;
      inviteeEmail: string;
      inviteeName?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const key = await getConnectionKeyForUser(data.hostUserId, CONNECTOR_ID);
    if (!key) return { eventId: null as string | null };
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/calendar/v3/calendars/primary/events?sendUpdates=all",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: data.summary,
          description: data.description ?? "",
          start: { dateTime: data.startISO },
          end: { dateTime: data.endISO },
          attendees: [{ email: data.inviteeEmail, displayName: data.inviteeName }],
        }),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("createEvent failed", res.status, text);
      return { eventId: null as string | null };
    }
    const body = await res.json();
    return { eventId: (body?.id ?? null) as string | null };
  });

/** Delete a Google Calendar event when a booking is cancelled. */
export const deleteBookingEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { hostUserId: string; eventId: string }) => input)
  .handler(async ({ data }) => {
    const key = await getConnectionKeyForUser(data.hostUserId, CONNECTOR_ID);
    if (!key) return { ok: false };
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: `/calendar/v3/calendars/primary/events/${encodeURIComponent(data.eventId)}?sendUpdates=all`,
      init: { method: "DELETE" },
    });
    return { ok: res.ok || res.status === 404 || res.status === 410 };
  });
