# Supabase Setup Guide

This guide will help you set up Supabase for persistent data storage in your Energy Harvesting Dashboard.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `energy-harvesting-dashboard`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key

### 3. Configure Environment Variables

1. Copy `env.example` to `.env.local`
2. Update the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Deploy Database Schema

The database schema will be automatically deployed via GitHub Actions when you push to main.

**Manual deployment (if needed):**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Deploy migrations
supabase db push
```

## 🔧 GitHub Actions Setup

### 1. Add Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token
- `PRODUCTION_DB_PASSWORD` - Your database password
- `PRODUCTION_PROJECT_ID` - Your project ID

### 2. Get Supabase Access Token

1. Go to [supabase.com/account/tokens](https://supabase.com/account/tokens)
2. Generate a new access token
3. Copy the token value

### 3. Get Project ID

1. In your Supabase project dashboard
2. Go to **Settings** → **General**
3. Copy the **Reference ID** (this is your project ID)

## 📊 Database Schema

The migration creates:

- **`sensor_data`** - Stores all sensor readings with calculated metrics
- **`device_status`** - Tracks device health and connection status
- **Views** - `recent_sensor_data` and `hourly_averages` for easy querying
- **Indexes** - For optimal query performance

## 🔄 How It Works

1. **ESP32 sends data** → API endpoint receives it
2. **Data is processed** → Calculates efficiency, energy, cost, carbon offset
3. **Data is stored** → Both in-memory (for real-time) and Supabase (for persistence)
4. **Dashboard loads** → Combines real-time stream data with historical Supabase data
5. **Charts persist** → Beautiful visualizations with historical context

## 🎯 Benefits

- **Persistent Data**: Your charts will show beautiful historical trends
- **Real-time Updates**: Stream continues to work for live data
- **Scalable**: Supabase handles data growth automatically
- **Backup**: Your data is safely stored in the cloud
- **Analytics**: Built-in views for hourly averages and trends

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API key"**

   - Check your environment variables
   - Ensure keys are copied correctly

2. **"Table doesn't exist"**

   - Run migrations: `supabase db push`
   - Check GitHub Actions for deployment status

3. **"Connection failed"**
   - Verify your Supabase URL
   - Check if your project is active

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review GitHub Actions logs for deployment issues
- Ensure all environment variables are set correctly

## 🔮 Next Steps

After setup, your dashboard will:

- ✅ Store all sensor data persistently
- ✅ Show beautiful historical charts
- ✅ Maintain real-time streaming
- ✅ Automatically deploy database changes
- ✅ Scale with your data growth

Happy harvesting! 🌞💨
