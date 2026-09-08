export type SubtitleCue = { text: string; start: number; end: number };

export function buildSubtitles(text: string, durationSeconds: number): SubtitleCue[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const words = clean.split(" ");
  const groups: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 48 || current.split(" ").length >= 8) {
      groups.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) groups.push(current);

  const totalChars = groups.reduce((sum, item) => sum + item.length, 0) || 1;
  let cursor = 0;
  return groups.map((group, index) => {
    const share = group.length / totalChars;
    const start = cursor;
    const end = index === groups.length - 1 ? durationSeconds : Math.min(durationSeconds, cursor + durationSeconds * share);
    cursor = end;
    return { text: group, start, end };
  });
}

export function estimateSpeechDuration(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.min(60, Math.ceil((words / 2.35) * 1.08)));
}
