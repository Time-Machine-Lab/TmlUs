import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export function canPrompt(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

export async function promptLine(message: string): Promise<string> {
  const readline = createInterface({ input, output });
  try {
    return (await readline.question(message)).trim();
  } finally {
    readline.close();
  }
}

export async function promptLineWithDefault(message: string, defaultValue: string): Promise<string | undefined> {
  if (!canPrompt()) {
    return defaultValue;
  }

  const answer = await promptLine(`${message} (${defaultValue}): `);
  return answer || defaultValue;
}
