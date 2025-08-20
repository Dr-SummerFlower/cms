export interface EcdsaKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EcdsaSignature {
  signature: string;
  data: string;
}

export interface TicketQRData {
  ticketId: string;
  signature: string;
  timestamp: number;
}
