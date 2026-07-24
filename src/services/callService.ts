export interface IncomingCall {
  id: string;
  callerName: string;
  callerNumber: string;
  avatarUrl?: string;
  timestamp: string;
  status: "ringing" | "accepted" | "heer_handling" | "declined";
}

export const SAMPLE_CONTACTS = [
  { name: "Papa Ji", number: "+91 98250 12345", category: "Family" },
  { name: "Mummy", number: "+91 98250 54321", category: "Family" },
  { name: "Rohan (Work)", number: "+91 99130 67890", category: "Work" },
  { name: "Priya", number: "+91 97240 11223", category: "Friend" },
  { name: "Unknown Caller", number: "+91 98765 00112", category: "Unknown" },
];

export function getRandomCaller(): { callerName: string; callerNumber: string } {
  const contact = SAMPLE_CONTACTS[Math.floor(Math.random() * SAMPLE_CONTACTS.length)];
  return {
    callerName: contact.name,
    callerNumber: contact.number,
  };
}
