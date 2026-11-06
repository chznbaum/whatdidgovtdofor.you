import type { CollectionEntry } from 'astro:content';
import { formatMonth } from './format.ts';

type Entry = CollectionEntry<'entries'>['data'];
export type StatusState = Entry['status']['state'];

// Sign color for each status (MUTCD vernacular; see docs/design.md).
export type Tone = 'guide' | 'work' | 'warning' | 'stop';

export const TONE: Record<StatusState, Tone> = {
  'in-effect': 'guide',
  delivered: 'guide',
  'phasing-in': 'work',
  'under-threat': 'warning',
  repealed: 'stop',
  expired: 'stop',
  blocked: 'stop',
  cancelled: 'stop',
};

export const STATUS_LABEL: Record<StatusState, string> = {
  'in-effect': 'In effect',
  delivered: 'Delivered',
  'phasing-in': 'Phasing in',
  'under-threat': 'Under threat',
  repealed: 'Repealed',
  expired: 'Expired',
  blocked: 'Blocked in court',
  cancelled: 'Cancelled',
};

// Short text for the supplemental plaque that hangs under a sign.
export function plaqueText({ status, action }: Entry, now = new Date()): string {
  const start = action.effective ?? action.date;
  switch (status.state) {
    case 'in-effect':
      return `In effect since ${formatMonth(start)}`;
    case 'delivered':
      return `Delivered ${formatMonth(start)}`;
    case 'phasing-in':
      return start > now ? `Phasing in, starts ${formatMonth(start)}` : `Phasing in since ${formatMonth(start)}`;
    default:
      return STATUS_LABEL[status.state];
  }
}

export const isEnded = (s: StatusState) => TONE[s] === 'stop';
