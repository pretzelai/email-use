# email-use

Manage your inbox with plain English. Write one prompt to handle all your emails - categorize, archive, reply, and more.

## What it does

Email Use lets you write a system prompt that gets applied to every incoming email. Instead of creating complex filters or rules, you describe what you want in natural language:

```
For each email:
- If it's from my team (@company.com), mark as important
- If it's a newsletter or marketing, archive immediately
- If someone is asking for a meeting, draft a polite reply asking for an agenda
- If it contains an invoice, label as "Finance"
```

The AI handles the rest - categorizing, archiving, replying, marking as read/unread, and applying labels automatically.

## Features

- **Plain English rules** - Write conditions like you'd explain to an assistant
- **Full email actions** - Reply, categorize, archive, mark read/unread, apply labels
- **Iterate anytime** - Refine your prompt as your needs change
- **Back-test your rules** - Test against past emails before deploying
- **Multiple AI providers** - Use Claude, GPT-4, or bring your own API keys
- **Self-hostable** - Run on your own infrastructure, MIT licensed

## Getting Started

### Prerequisites

- Node.js 18+
- A Gmail account
- API key from Anthropic (Claude) or OpenAI (GPT-4)

### Installation

```bash
# Clone the repo
git clone https://github.com/pretzelai/email-use.git
cd email-use

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Run database migrations
bunx drizzle-kit push

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

### Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
GOOGLE_CLIENT_ID=       # Google OAuth client ID
GOOGLE_CLIENT_SECRET=   # Google OAuth client secret
ANTHROPIC_API_KEY=      # Optional: Anthropic API key for Claude
OPENAI_API_KEY=         # Optional: OpenAI API key for GPT-4
```

## How it works

1. **Connect your Gmail** - Securely authenticate with Google OAuth
2. **Write your prompt** - Describe how you want emails handled in plain English
3. **Test it** - Back-test against existing emails to verify behavior
4. **Deploy** - Enable the prompt to process incoming emails automatically

Emails are processed in real-time as they arrive. You can view all processed emails and the actions taken in the dashboard.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Better Auth](https://better-auth.com) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling

## License

MIT
