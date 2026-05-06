const HEADER = /^\s*\[(\d{1,2}):(\d{2}):(\d{2})\]\s*([^:]+?):\s*(.*)$/;

export function parseTranscript(text) {
  const segments = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    const m = line.match(HEADER);
    if (m) {
      const [, hh, mm, ss, speaker, body] = m;
      segments.push({
        speaker: speaker.trim(),
        text: body.trim(),
        tsSeconds: Number(hh) * 3600 + Number(mm) * 60 + Number(ss),
        lineNo: idx + 1,
      });
      return;
    }

    if (segments.length === 0) {
      throw new Error(
        `parse error on line ${idx + 1}: expected "[hh:mm:ss] Speaker: text", got: ${rawLine}`
      );
    }
    const prev = segments[segments.length - 1];
    prev.text = prev.text ? `${prev.text} ${line}` : line;
  });

  return segments;
}
