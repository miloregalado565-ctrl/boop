interface Props {
  isLive?: boolean;
  text?: string;
}

export function LiveBadge({ isLive = true, text = 'LIVE' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
      isLive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
      {text}
    </span>
  );
}
