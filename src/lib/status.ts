import type { CollectionEntry } from 'astro:content';
import { formatMonth, formatShortDate } from './format.ts';

type Entry = CollectionEntry<'entries'>['data'];
export type StatusState = Entry['status']['state'];
type ActionType = Entry['action']['type'];

// Status never uses hue (docs/design.md, "Status"). Each state gets a shape, always paired with words:
// a filled disc for working now, a half disc for enacted but not fully here yet, a disc with a wedge
// cut out for under threat (set on an ink band), and an open ring for ended.
export type Mark = 'full' | 'half' | 'threat' | 'ring';
// Groups used for filtering and sorting lists.
export type Group = 'working' | 'coming' | 'threat' | 'ended';

export const MARK: Record<StatusState, Mark> = {
  'in-effect': 'full',
  delivered: 'full',
  'phasing-in': 'half',
  'under-threat': 'threat',
  repealed: 'ring',
  expired: 'ring',
  blocked: 'ring',
  cancelled: 'ring',
};

export const GROUP: Record<StatusState, Group> = {
  'in-effect': 'working',
  delivered: 'working',
  'phasing-in': 'coming',
  'under-threat': 'threat',
  repealed: 'ended',
  expired: 'ended',
  blocked: 'ended',
  cancelled: 'ended',
};

export const GROUP_LABEL: Record<Group, string> = {
  working: 'Working now',
  coming: 'Coming',
  threat: 'Under threat',
  ended: 'Ended',
};

export const STATUS_LABEL: Record<StatusState, string> = {
  'in-effect': 'Working now',
  delivered: 'Delivered',
  'phasing-in': 'Rolling out',
  'under-threat': 'Under threat',
  repealed: 'Repealed',
  expired: 'Expired',
  blocked: 'Blocked in court',
  cancelled: 'Cancelled',
};

// What an enacted-but-not-started action is right now, said the way it's true for its type.
// "Law now." is only for laws; a budget item is funded, an order is ordered.
const ENACTED: Record<ActionType, string> = {
  law: 'Law now.',
  ordinance: 'Law now.',
  'ballot-measure': 'Approved by voters.',
  budget: 'Funded.',
  grant: 'Funded.',
  program: 'Underway.',
  regulation: 'Rule adopted.',
  'executive-order': 'Ordered.',
  settlement: 'Settled.',
};

export const isEnded = (s: StatusState) => GROUP[s] === 'ended';

// The status in words: a short headline that is true on its own, plus the longer detail when there is one.
// "Law now. Benefits start Dec. 1, 2028." Never phrased to suggest people have something they don't yet.
export function statusText({ status, action }: Entry, now = new Date()): { head: string; detail?: string } {
  const start = action.effective ?? action.date;
  switch (status.state) {
    case 'in-effect':
      return { head: 'Working now.', detail: `In effect since ${formatMonth(start)}.` };
    case 'delivered':
      return { head: 'Delivered.', detail: `Paid out or completed in ${formatMonth(start)}.` };
    case 'phasing-in':
      if (action.effective && action.effective > now)
        return { head: `${ENACTED[action.type]} Benefits start ${formatShortDate(action.effective).replaceAll(' ', '\u00a0')}.`, detail: status.note };
      return { head: 'Rolling out. Not everyone has it yet.', detail: status.note };
    default:
      return { head: `${STATUS_LABEL[status.state]}.`, detail: status.note };
  }
}
