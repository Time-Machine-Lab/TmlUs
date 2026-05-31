import type { WriteStream } from 'node:tty';

export type BannerMode = 'animated' | 'static-full' | 'static-compact' | 'monochrome' | 'suppressed';

export interface BannerEnvironment {
  args: string[];
  columns: number;
  env: NodeJS.ProcessEnv;
  isTTY: boolean;
  platform: NodeJS.Platform;
}

export interface BannerRenderOptions {
  args?: string[];
  env?: NodeJS.ProcessEnv;
  stdout?: NodeJS.WriteStream | WriteStream;
}

const FULL_BANNER_MIN_COLUMNS = 82;
const COMPACT_BANNER_MIN_COLUMNS = 42;
const ANIMATION_FRAME_DELAY_MS = 110;
const BOX_WIDTH = 78;

const fullLogo = [
  '████████╗ ███╗   ███╗ ██╗',
  '╚══██╔══╝ ████╗ ████║ ██║',
  '   ██║    ██╔████╔██║ ██║',
  '   ██║    ██║╚██╔╝██║ ██║',
  '   ██║    ██║ ╚═╝ ██║ ███████╗',
  '   ╚═╝    ╚═╝     ╚═╝ ╚══════╝'
];

const asciiLogo = [
  'TTTTTTT  M     M  L',
  '   T     MM   MM  L',
  '   T     M M M M  L',
  '   T     M  M  M  L',
  '   T     M     M  LLLLLLL'
];

const compactIdentity = 'TML ✦ TmlUs AI Dev Workspace';

const palette = {
  aqua: [136, 247, 255],
  gold: [255, 230, 129],
  mint: [170, 255, 216],
  pink: [255, 143, 216],
  violet: [197, 161, 255],
  white: [255, 248, 255]
} as const;

function ansi(code: string): string {
  return `\u001B[${code}m`;
}

function rgb(color: readonly [number, number, number]): string {
  return ansi(`38;2;${color[0]};${color[1]};${color[2]}`);
}

const style = {
  bgPanel: ansi('48;2;36;21;54'),
  bold: ansi('1'),
  dim: ansi('2'),
  reset: ansi('0'),
  aqua: rgb(palette.aqua),
  gold: rgb(palette.gold),
  mint: rgb(palette.mint),
  pink: rgb(palette.pink),
  violet: rgb(palette.violet),
  white: rgb(palette.white)
};

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;?]*[A-Za-z]/g, '');
}

function visibleLength(value: string): number {
  return stripAnsi(value).length;
}

function padRight(value: string, width: number): string {
  return `${value}${' '.repeat(Math.max(0, width - visibleLength(value)))}`;
}

function center(value: string, width: number): string {
  const size = visibleLength(value);
  const left = Math.max(0, Math.floor((width - size) / 2));
  const right = Math.max(0, width - size - left);

  return `${' '.repeat(left)}${value}${' '.repeat(right)}`;
}

function boxLine(content = '', color = style.violet): string {
  return `${style.violet}│${style.reset} ${padRight(content, BOX_WIDTH - 2)} ${style.violet}│${style.reset}`;
}

function topBorder(): string {
  return `${style.violet}╭${'─'.repeat(BOX_WIDTH)}╮${style.reset}`;
}

function divider(): string {
  return `${style.violet}├${'─'.repeat(BOX_WIDTH)}┤${style.reset}`;
}

function bottomBorder(): string {
  return `${style.violet}╰${'─'.repeat(BOX_WIDTH)}╯${style.reset}`;
}

function chromeLine(): string {
  const controls = `${style.pink}●${style.reset} ${style.gold}●${style.reset} ${style.mint}●${style.reset}`;
  const title = `${style.dim}tmlus.exe --wake-up${style.reset}`;

  return boxLine(`${controls}  ${title}`);
}

function ribbonLine(frameIndex = 0): string {
  const colors = [style.mint, style.gold, style.pink, style.aqua, style.white];
  const text = ' TML AI DEV ATELIER ';
  const ribbon = text
    .split('')
    .map((char, index) => `${colors[(index + frameIndex) % colors.length]}${char}${style.reset}`)
    .join('');

  return boxLine(center(`${style.pink}◆${style.reset}${ribbon}${style.pink}◆${style.reset}`, BOX_WIDTH - 2));
}

function haloLine(frameIndex = 0): string {
  const halo = frameIndex % 2 === 0
    ? '.-~~~~~~~ magical startup halo ~~~~~~~-.'
    : '.-~~~~~  magical startup halo  ~~~~~-.';

  return boxLine(center(`${style.dim}${style.aqua}${halo}${style.reset}`, BOX_WIDTH - 2));
}

function sparkleLine(frameIndex = 0): string {
  const sparks = [
    `${style.gold}✦${style.reset}`,
    `${style.aqua}◇${style.reset}`,
    `${style.pink}✧${style.reset}`,
    `${style.mint}+${style.reset}`
  ];
  const shifted = sparks.slice(frameIndex % sparks.length).concat(sparks.slice(0, frameIndex % sparks.length));

  return boxLine(`${shifted[0]}${' '.repeat(22)}${shifted[1]}${' '.repeat(21)}${shifted[2]}${' '.repeat(22)}${shifted[3]}`);
}

function hasArg(args: string[], ...names: string[]): boolean {
  return args.some((arg) => names.includes(arg));
}

function isTruthyEnv(value: string | undefined): boolean {
  return value === '1' || value?.toLowerCase() === 'true' || value?.toLowerCase() === 'yes';
}

function isCiEnvironment(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.CI
      || env.GITHUB_ACTIONS
      || env.GITLAB_CI
      || env.BITBUCKET_BUILD_NUMBER
      || env.BUILD_BUILDID
      || env.TEAMCITY_VERSION
  );
}

function supportsColor(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): boolean {
  if (isTruthyEnv(env.NO_COLOR)) {
    return false;
  }

  if (env.FORCE_COLOR && env.FORCE_COLOR !== '0') {
    return true;
  }

  if (env.TERM === 'dumb') {
    return false;
  }

  return platform === 'win32'
    || Boolean(env.COLORTERM)
    || /color|ansi|xterm|screen|tmux|vt100/i.test(env.TERM ?? '');
}

function getColumns(stdout: NodeJS.WriteStream | WriteStream | undefined): number {
  return stdout?.columns ?? 80;
}

export function createBannerEnvironment(options: BannerRenderOptions = {}): BannerEnvironment {
  const stdout = options.stdout ?? process.stdout;

  return {
    args: options.args ?? process.argv.slice(2),
    columns: getColumns(stdout),
    env: options.env ?? process.env,
    isTTY: Boolean(stdout.isTTY),
    platform: process.platform
  };
}

export function selectBannerMode(context: BannerEnvironment): BannerMode {
  if (
    hasArg(context.args, '--no-banner', '--quiet')
    || isTruthyEnv(context.env.TMLUS_NO_BANNER)
    || hasArg(context.args, '--version', '-v')
  ) {
    return 'suppressed';
  }

  if (!context.isTTY || isCiEnvironment(context.env)) {
    return 'suppressed';
  }

  if (!supportsColor(context.env, context.platform)) {
    return context.columns >= COMPACT_BANNER_MIN_COLUMNS ? 'monochrome' : 'suppressed';
  }

  if (isTruthyEnv(context.env.TMLUS_BANNER_STATIC)) {
    return context.columns >= FULL_BANNER_MIN_COLUMNS ? 'static-full' : 'static-compact';
  }

  if (context.columns >= FULL_BANNER_MIN_COLUMNS) {
    return 'animated';
  }

  if (context.columns >= COMPACT_BANNER_MIN_COLUMNS) {
    return 'static-compact';
  }

  return 'suppressed';
}

function colorizeLine(line: string, index: number): string {
  const colors = [style.aqua, style.white, style.pink, style.gold, style.mint, style.violet];
  return `${colors[index % colors.length]}${line}${style.reset}`;
}

function logoLine(line: string, index: number, frameIndex = 0): string {
  return boxLine(center(`${style.bold}${colorizeLine(line, index + frameIndex)}${style.reset}`, BOX_WIDTH - 2));
}

function progressBar(frameIndex: number, final = false): string {
  const fills = final ? 26 : [4, 9, 14, 20, 26][frameIndex] ?? 26;
  const empty = 26 - fills;
  const bar = `${style.aqua}${'█'.repeat(fills)}${style.dim}${style.violet}${'░'.repeat(empty)}${style.reset}`;

  return `[${bar}]`;
}

function consoleLines(frameIndex = 4, final = true): string[] {
  const caret = final || frameIndex % 2 === 0 ? `${style.pink}█${style.reset}` : ' ';
  const progress = progressBar(frameIndex, final);

  return [
    boxLine(`${style.mint}tmlus${style.reset} ${style.dim}>${style.reset} ${style.white}正在召唤 TML AI 开发工作台...${style.reset}${caret}`),
    boxLine(`${style.pink}◇${style.reset} ${style.white}profile:${style.reset} ${style.aqua}kawaii-spec-driven${style.reset} ${style.dim}/ skills, commands, specs are twinkling${style.reset}`),
    boxLine(`${style.gold}✦${style.reset} ${style.white}status:${style.reset} ${style.pink}TML workspace is warming up${style.reset}`),
    boxLine(center(progress, BOX_WIDTH - 2))
  ];
}

function renderFullStatic(frameIndex = 4): string {
  return [
    '',
    topBorder(),
    chromeLine(),
    divider(),
    sparkleLine(frameIndex),
    boxLine(),
    ribbonLine(frameIndex),
    haloLine(frameIndex),
    ...fullLogo.map((line, index) => logoLine(line, index, frameIndex)),
    boxLine(),
    ...consoleLines(frameIndex, true),
    bottomBorder(),
    ''
  ].join('\n');
}

function renderCompactStatic(): string {
  return [
    '',
    `${style.pink}✦${style.reset} ${style.bold}${style.mint}${compactIdentity}${style.reset}`,
    `${style.dim}profile:${style.reset} ${style.aqua}kawaii-spec-driven${style.reset} ${style.dim}/ skills, commands, specs${style.reset}`,
    ''
  ].join('\n');
}

function renderMonochrome(): string {
  return [
    '',
    '+------------------------------------------------------------------------------+',
    '| tmlus.exe --wake-up                                                          |',
    '+------------------------------------------------------------------------------+',
    '|                         TML AI DEV ATELIER                                   |',
    '|                    .-~~~~ magical startup halo ~~~-.                         |',
    ...asciiLogo,
    '| tmlus > TML AI development workspace                                         |',
    '| profile: kawaii-spec-driven / skills, commands, specs                        |',
    '+------------------------------------------------------------------------------+',
    ''
  ].join('\n');
}

function renderAnimatedFrame(frameIndex: number): string {
  const logoLines = fullLogo.map((line, index) => {
    if (index > frameIndex + 1) {
      return logoLine(line.replace(/[^\s]/g, '·'), index, frameIndex);
    }

    return logoLine(line, index, frameIndex);
  });

  return [
    topBorder(),
    chromeLine(),
    divider(),
    sparkleLine(frameIndex),
    boxLine(),
    ribbonLine(frameIndex),
    haloLine(frameIndex),
    ...logoLines,
    boxLine(),
    ...consoleLines(frameIndex, frameIndex >= 4),
    bottomBorder()
  ].join('\n');
}

function clearLines(lineCount: number): string {
  return `\u001B[${lineCount}F\u001B[J`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function renderAnimated(stdout: NodeJS.WriteStream | WriteStream): Promise<void> {
  const frameCount = 5;

  stdout.write('\u001B[?25l');
  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const frame = renderAnimatedFrame(frameIndex);
      const linesPerFrame = frame.split('\n').length + 1;

      stdout.write(frame);

      if (frameIndex < frameCount - 1) {
        stdout.write('\n');
        await wait(ANIMATION_FRAME_DELAY_MS);
        stdout.write(clearLines(linesPerFrame));
      }
    }

    stdout.write('\n\n');
  } finally {
    stdout.write('\u001B[?25h');
  }
}

export function renderStaticBanner(mode: Exclude<BannerMode, 'animated' | 'suppressed'>): string {
  if (mode === 'static-full') {
    return renderFullStatic();
  }

  if (mode === 'static-compact') {
    return renderCompactStatic();
  }

  return renderMonochrome();
}

export async function renderStartupBanner(options: BannerRenderOptions = {}): Promise<BannerMode> {
  const stdout = options.stdout ?? process.stdout;

  try {
    const mode = selectBannerMode(createBannerEnvironment({ ...options, stdout }));

    if (mode === 'suppressed') {
      return mode;
    }

    if (mode === 'animated') {
      await renderAnimated(stdout);
      return mode;
    }

    stdout.write(renderStaticBanner(mode));
    return mode;
  } catch {
    return 'suppressed';
  }
}
