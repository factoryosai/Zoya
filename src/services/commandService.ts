export function processCommand(command: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  isSyncAction?: boolean;
} {
  const lowerCmd = command.toLowerCase().trim();

  // Update All Data / Sync All Data Commands
  if (
    lowerCmd.includes("update all data") ||
    lowerCmd.includes("update data") ||
    lowerCmd.includes("sync all data") ||
    lowerCmd.includes("sync data") ||
    lowerCmd.includes("refresh all data") ||
    lowerCmd.includes("refresh data") ||
    lowerCmd.includes("data update") ||
    lowerCmd.includes("data refresh") ||
    lowerCmd.includes("data sync") ||
    lowerCmd.includes("saara data update") ||
    lowerCmd.includes("sara data update")
  ) {
    return {
      action: "Ji Kaushik, main aapka saara data—Firebase Cloud Memories, Google Workspace (Tasks, Calendar, Contacts, Gmail), Evolution API WhatsApp, aur Alarms sync aur update kar rahi hu.",
      isBrowserAction: true,
      isSyncAction: true,
    };
  }

  // Phone Call Dialer: "call [number/name]" or "dial [number]"
  const callMatch = lowerCmd.match(/^(?:call|dial)\s+([\d\+\s]+|[a-zA-Z\s]+)$/);
  if (callMatch) {
    const target = callMatch[1].trim();
    const isDigits = /^[\d\+\s]+$/.test(target);
    const cleanNumber = target.replace(/\s+/g, "");
    const telUrl = isDigits ? `tel:${cleanNumber}` : `tel:`;
    return {
      action: `Initiating call to ${target} for you, Kaushik.`,
      url: telUrl,
      isBrowserAction: true,
    };
  }

  // Camera Access: "open camera" or "take photo"
  if (lowerCmd.includes("open camera") || lowerCmd.includes("take photo") || lowerCmd.includes("take picture")) {
    return {
      action: "Activating mobile camera with full capture permission.",
      url: "camera://active",
      isBrowserAction: true,
    };
  }

  // Bluetooth Toggle: "turn on bluetooth" / "toggle bluetooth"
  if (lowerCmd.includes("bluetooth")) {
    return {
      action: "Bluetooth control permission granted & active.",
      isBrowserAction: true,
    };
  }

  // Wi-Fi / Hotspot Toggles
  if (lowerCmd.includes("wifi") || lowerCmd.includes("wi-fi")) {
    return {
      action: "Wi-Fi management active.",
      isBrowserAction: true,
    };
  }

  if (lowerCmd.includes("hotspot")) {
    return {
      action: "Mobile Hotspot control active.",
      isBrowserAction: true,
    };
  }

  // File Manager & Storage Access
  if (lowerCmd.includes("file manager") || lowerCmd.includes("open files") || lowerCmd.includes("storage")) {
    return {
      action: "Accessing File Manager & Local Storage.",
      url: "content://com.android.externalstorage.documents/root/primary",
      isBrowserAction: true,
    };
  }

  // System Notifications
  if (lowerCmd.includes("notification") || lowerCmd.includes("alerts")) {
    return {
      action: "System Notifications & Listener active.",
      isBrowserAction: true,
    };
  }

  // Contacts Access
  if (lowerCmd.includes("contacts") || lowerCmd.includes("address book")) {
    return {
      action: "Contacts sync granted.",
      url: "content://contacts/people",
      isBrowserAction: true,
    };
  }

  // General Browsing: "Open [website name]"
  const openMatch = lowerCmd.match(/^open\s+(.+)$/);
  if (
    openMatch &&
    !lowerCmd.includes("youtube") &&
    !lowerCmd.includes("spotify") &&
    !lowerCmd.includes("camera") &&
    !lowerCmd.includes("file") &&
    !lowerCmd.includes("notification")
  ) {
    let website = openMatch[1].trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `Opening ${openMatch[1]} for you, Kaushik.`,
      url: `https://www.${website}`,
      isBrowserAction: true,
    };
  }

  // Media Search: "Play [song/video] on YouTube"
  const ytMatch = lowerCmd.match(/^play\s+(.+?)\s+on\s+youtube$/);
  if (ytMatch) {
    const query = encodeURIComponent(ytMatch[1].trim());
    return {
      action: `Playing ${ytMatch[1]} on YouTube for you, Kaushik.`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true,
    };
  }

  // Media Search: "Search [query] on Spotify"
  const spotifyMatch = lowerCmd.match(/^search\s+(.+?)\s+on\s+spotify$/);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    return {
      action: `Searching ${spotifyMatch[1]} on Spotify for you, Kaushik.`,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true,
    };
  }

  // WhatsApp Web: "Send a WhatsApp message to [number] saying [message]"
  const waMatch = lowerCmd.match(
    /^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$/,
  );
  if (waMatch) {
    const number = waMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waMatch[2].trim());
    return {
      action: `Sending your WhatsApp message right away, Kaushik.`,
      url: `https://web.whatsapp.com/send?phone=${number}&text=${message}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}

