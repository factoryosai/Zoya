// Evolution API WhatsApp Integration Service for Heer AI

export interface EvolutionApiConfig {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  defaultCountryCode: string;
}

const STORAGE_KEY = "heer_evolution_api_config";

export function getEvolutionConfig(): EvolutionApiConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        baseUrl: parsed.baseUrl || "",
        instanceName: parsed.instanceName || "",
        apiKey: parsed.apiKey || "",
        defaultCountryCode: parsed.defaultCountryCode || "91",
      };
    }
  } catch (e) {
    console.error("Error reading Evolution API config:", e);
  }

  return {
    baseUrl: import.meta.env?.VITE_EVOLUTION_BASE_URL || "",
    instanceName: import.meta.env?.VITE_EVOLUTION_INSTANCE || "",
    apiKey: import.meta.env?.VITE_EVOLUTION_API_KEY || "",
    defaultCountryCode: "91",
  };
}

export function saveEvolutionConfig(config: EvolutionApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Error saving Evolution API config:", e);
  }
}

/**
 * Clean and format phone number for Evolution API
 * e.g., "9876543210" -> "919876543210"
 * "+91 98765-43210" -> "919876543210"
 */
export function formatWhatsAppNumber(rawNumber: string, defaultCC: string = "91"): string {
  if (!rawNumber) return "";
  
  // Strip non-digit characters
  let cleaned = rawNumber.replace(/\D/g, "");

  // If user typed 10-digit Indian phone number without country code
  if (cleaned.length === 10) {
    cleaned = defaultCC + cleaned;
  }

  return cleaned;
}

/**
 * Test Evolution API connection state
 */
export async function checkEvolutionConnection(customConfig?: EvolutionApiConfig): Promise<{
  connected: boolean;
  state?: string;
  message: string;
}> {
  const config = customConfig || getEvolutionConfig();

  if (!config.baseUrl || !config.instanceName || !config.apiKey) {
    return {
      connected: false,
      message: "Evolution API configurations incomplete. Please provide Base URL, Instance Name, and API Key.",
    };
  }

  let cleanBaseUrl = config.baseUrl.trim().replace(/\/$/, "");

  try {
    // Try fetching instance connection state
    const res = await fetch(`${cleanBaseUrl}/instance/connectionState/${config.instanceName}`, {
      method: "GET",
      headers: {
        "apikey": config.apiKey.trim(),
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      // Fallback try v1 instance fetch
      const resAlt = await fetch(`${cleanBaseUrl}/instance/fetchInstances`, {
        method: "GET",
        headers: {
          "apikey": config.apiKey.trim(),
          "Content-Type": "application/json",
        },
      });

      if (resAlt.ok) {
        return {
          connected: true,
          state: "open",
          message: "Evolution API connected successfully!",
        };
      }

      return {
        connected: false,
        message: `HTTP Error ${res.status}: Failed to connect to Evolution API instance '${config.instanceName}'`,
      };
    }

    const data = await res.json();
    const state = data?.instance?.state || data?.state || "open";
    
    return {
      connected: true,
      state,
      message: `Evolution API connected! Connection state: ${state}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network error connecting to Evolution API: ${err?.message || "Check URL and API Key"}`,
    };
  }
}

/**
 * Send WhatsApp text message via Evolution API
 */
export async function sendWhatsAppMessage(
  recipient: string,
  messageText: string
): Promise<{ success: boolean; message: string; responseData?: any }> {
  const config = getEvolutionConfig();

  if (!config.baseUrl || !config.instanceName || !config.apiKey) {
    return {
      success: false,
      message: "Evolution API credentials incomplete. Please open Settings -> WhatsApp (Evolution API) and enter your Base URL, Instance Name, and API Key.",
    };
  }

  const formattedNumber = formatWhatsAppNumber(recipient, config.defaultCountryCode);
  if (!formattedNumber) {
    return {
      success: false,
      message: "Invalid recipient phone number format.",
    };
  }

  const cleanBaseUrl = config.baseUrl.trim().replace(/\/$/, "");
  const endpoint = `${cleanBaseUrl}/message/sendText/${config.instanceName.trim()}`;

  const payload = {
    number: formattedNumber,
    text: messageText,
    options: {
      delay: 1200,
      presence: "composing",
      linkPreview: true,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "apikey": config.apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && (data?.key || data?.status === "PENDING" || data?.message === "Message sent" || res.status === 200 || res.status === 201)) {
      return {
        success: true,
        message: `WhatsApp message sent successfully to +${formattedNumber} via Evolution API!`,
        responseData: data,
      };
    } else {
      const errorMsg = data?.message || data?.error || JSON.stringify(data) || `HTTP ${res.status}`;
      return {
        success: false,
        message: `Evolution API error: ${errorMsg}`,
        responseData: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to send WhatsApp message via Evolution API: ${err?.message || "Network error"}`,
    };
  }
}

/**
 * Send WhatsApp media (image/document/voice) via Evolution API
 */
export async function sendWhatsAppMedia(
  recipient: string,
  mediaUrl: string,
  caption?: string,
  mediaType: "image" | "document" | "video" | "audio" = "image"
): Promise<{ success: boolean; message: string; responseData?: any }> {
  const config = getEvolutionConfig();

  if (!config.baseUrl || !config.instanceName || !config.apiKey) {
    return {
      success: false,
      message: "Evolution API credentials incomplete in Settings.",
    };
  }

  const formattedNumber = formatWhatsAppNumber(recipient, config.defaultCountryCode);
  const cleanBaseUrl = config.baseUrl.trim().replace(/\/$/, "");
  const endpoint = `${cleanBaseUrl}/message/sendMedia/${config.instanceName.trim()}`;

  const payload = {
    number: formattedNumber,
    mediaMessage: {
      mediatype: mediaType,
      media: mediaUrl,
      caption: caption || "",
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "apikey": config.apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: `Media sent to +${formattedNumber} on WhatsApp!`,
        responseData: data,
      };
    } else {
      return {
        success: false,
        message: `Evolution API media error: ${data?.message || "Failed to send media"}`,
        responseData: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error sending WhatsApp media: ${err?.message}`,
    };
  }
}
