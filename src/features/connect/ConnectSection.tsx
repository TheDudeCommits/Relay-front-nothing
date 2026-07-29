import { useState } from 'react';
import { Link } from 'react-router';
import { MessageSquare, Terminal } from 'lucide-react';
import { config } from '../../config';
import { Panel } from '../../components/ui/Panel';
import { CopyBlock } from '../../components/ui/CopyBlock';

const MCP = config.mcpUrl;

interface Agent {
  name: string;
  icon: 'terminal' | 'chat';
  /** Descriptive line shown above the steps (ChatGPT / Headless). */
  note?: string;
  /** The "add MCP server" command. */
  add?: string;
  /** Prompts to try once connected. */
  prompts?: string[];
  /** Optional trailing link (e.g. create an API key). */
  link?: { to: string; text: string };
}

const AGENTS: Agent[] = [
  {
    name: 'Claude Code',
    icon: 'terminal',
    add: `claude mcp add relay ${MCP}`,
    prompts: ['claude "Show me the available card products"', 'claude "Buy me a $50 USD card"'],
  },
  {
    name: 'opencode',
    icon: 'terminal',
    add: `opencode mcp add relay --url ${MCP}`,
    prompts: [
      'opencode run "Show me the available card products"',
      'opencode run "Buy me a $50 USD card"',
    ],
  },
  {
    name: 'Codex',
    icon: 'terminal',
    add: `codex mcp add relay ${MCP}`,
    prompts: ['codex "Show me the available card products"', 'codex "Buy me a $50 USD card"'],
  },
  {
    name: 'Amp',
    icon: 'terminal',
    add: `amp mcp add relay ${MCP}`,
    prompts: ['amp -x "Show me the available card products"', 'amp -x "Buy me a $50 USD card"'],
  },
  {
    name: 'ChatGPT',
    icon: 'chat',
    note: `Add a custom app / connector pointing at ${MCP}, then in chat:`,
    prompts: ['Show me the available card products', 'Buy me a $50 USD card'],
  },
  {
    name: 'Headless / CI',
    icon: 'terminal',
    note: 'Skip the browser with a long-lived API key minted from your dashboard.',
    add: `claude mcp add relay ${MCP} --header "Authorization: Bearer pb_live_<key>"`,
    link: { to: '/dashboard', text: 'Create an API key →' },
  },
];

function ConnectCard() {
  const [active, setActive] = useState(0);
  const agent = AGENTS[active];
  const Icon = agent.icon === 'chat' ? MessageSquare : Terminal;
  // Numbered "1 · add / 2 · ask" steps only read right for plain CLI agents.
  const numbered = Boolean(agent.add && agent.prompts && !agent.note);

  return (
    <div>
      {/* Agent switcher */}
      <div role="tablist" aria-label="Choose an agent" className="flex flex-wrap gap-2">
        {AGENTS.map((a, i) => {
          const selected = i === active;
          return (
            <button
              key={a.name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[12.5px] transition duration-150 active:translate-y-px ${
                selected
                  ? 'border-line-strong bg-surface text-display'
                  : 'border-line text-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {/* active state = the lone red signal */}
              <span
                className={`size-1.5 rounded-full ${selected ? 'bg-signal' : 'bg-transparent'}`}
                aria-hidden="true"
              />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* One card, re-rising on each switch */}
      <Panel key={agent.name} className="relay-rise mt-4 flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md border border-line text-muted">
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h3 className="font-display text-base font-semibold text-ink">{agent.name}</h3>
        </div>

        {agent.note && <p className="text-sm leading-relaxed text-muted">{agent.note}</p>}

        {agent.add && (
          <CopyBlock
            label={numbered ? '1 · Add the Relay MCP server' : undefined}
            code={agent.add}
          />
        )}

        {agent.prompts && (
          <div className="flex flex-col gap-2">
            {numbered && <p className="text-xs text-faint">2 · Open your agent and ask</p>}
            {agent.prompts.map((p) => (
              <CopyBlock key={p} code={p} />
            ))}
          </div>
        )}

        {agent.link && (
          <Link
            to={agent.link.to}
            className="w-fit text-sm font-medium text-ink underline-offset-4 transition-colors duration-150 hover:underline"
          >
            {agent.link.text}
          </Link>
        )}
      </Panel>
    </div>
  );
}

/**
 * `landing` — full-width band with a big heading + intro (used on the public
 * landing page). `dashboard` — compact inline section matching the dashboard's
 * other section headings (so signed-in users can reach the instructions too).
 */
export function ConnectSection({ variant = 'landing' }: { variant?: 'landing' | 'dashboard' }) {
  if (variant === 'dashboard') {
    return (
      <section className="mt-9">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-faint">
          Connect an agent
        </h2>
        <ConnectCard />
      </section>
    );
  }

  return (
    <section id="connect" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="relay-rise max-w-2xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Connect an agent
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Add the Relay MCP server to your AI agent, then ask it to spend. On
            first use the agent prints a sign-in link — open it to authorize and
            it picks up its token automatically.
          </p>
        </div>

        <div className="relay-rise mt-8 max-w-2xl" style={{ animationDelay: '60ms' }}>
          <ConnectCard />
        </div>
      </div>
    </section>
  );
}
