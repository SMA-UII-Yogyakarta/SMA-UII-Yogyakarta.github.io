export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  active: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
  inactive: 'text-gray-400 bg-gray-400/10',
};

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  contribution: 'bg-purple-500/20 text-purple-400',
  event: 'bg-blue-500/20 text-blue-400',
  workshop: 'bg-green-500/20 text-green-400',
  meeting: 'bg-yellow-500/20 text-yellow-400',
  other: 'bg-gray-500/20 text-gray-400',
};
