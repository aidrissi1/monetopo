/**
 * QE money-flow tracer types.
 */

export type TracerChannel =
  | "bank_reserves"
  | "asset_prices"
  | "fiscal_channel"
  | "real_credit";

export interface TransmissionPreset {
  id: string;
  label: string;
  context: string;
  verified: boolean;
  source: string;
  ratios: Record<TracerChannel, number>;
  explanation: string;
}

export interface ChannelMeta {
  label: string;
  description: string;
  color: string;
}

export interface QeTransmissionData {
  _meta: unknown;
  presets: TransmissionPreset[];
  channels: Record<TracerChannel, ChannelMeta>;
}
