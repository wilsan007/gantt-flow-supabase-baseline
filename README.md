# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e391b3cb-b0ad-4651-bc99-e2afacbf273c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e391b3cb-b0ad-4651-bc99-e2afacbf273c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)

## 🗄️ Database Setup (Supabase)

This project includes a complete Supabase database baseline with:

- ✅ **Complete schema** with all tables, functions, and triggers
- ✅ **Row Level Security (RLS)** policies for data protection
- ✅ **Edge Functions** for server-side logic
- ✅ **Email templates** for authentication flows

### Quick Setup:

1. Create a new Supabase project
2. Run the baseline migration:
   ```bash
   supabase db reset
   ```
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy
   ```

### Files:
- `baseline_schema.sql` - Complete database schema
- `supabase/migrations/` - All database migrations
- `supabase/functions/` - Edge Functions
- `supabase/config.toml` - Supabase configuration

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e391b3cb-b0ad-4651-bc99-e2afacbf273c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
