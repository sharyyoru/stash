import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // This endpoint provides the cron job setup instructions
    const cronUrl = `${process.env.NEXTAUTH_URL || ''}/api/cron/renewal-notifications`;
    
    const instructions = {
      cronUrl,
      cronExpression: "0 9 * * *", // Daily at 9 AM UTC
      description: "Daily renewal notifications check",
      setupOptions: {
        // Option 1: Vercel Cron Jobs (if using Vercel)
        vercel: {
          type: "vercel.json",
          content: {
            "crons": [
              {
                "path": "/api/cron/renewal-notifications",
                "schedule": "0 9 * * *"
              }
            ]
          }
        },
        
        // Option 2: GitHub Actions (if you want to keep it in your repo)
        githubActions: {
          workflowFile: ".github/workflows/renewal-notifications.yml",
          content: `name: Daily Renewal Notifications

on:
  schedule:
    - cron: '0 9 * * *' # Daily at 9 AM UTC
  workflow_dispatch: # Allow manual triggering

jobs:
  renewal-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call renewal notifications API
        run: |
          curl -X GET "${cronUrl}" \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}" || true
        env:
          cronUrl: ${cronUrl}`
        },
        
        // Option 3: External Cron Services
        externalServices: [
          {
            name: "EasyCron",
            setupUrl: "https://www.easycron.com/",
            instructions: `Add a cron job with URL: ${cronUrl} and schedule: Daily at 9 AM`
          },
          {
            name: "Cron-job.org",
            setupUrl: "https://cron-job.org/",
            instructions: `Create a cron job calling: ${cronUrl} with schedule: 0 9 * * *`
          },
          {
            name: "Cronometer",
            setupUrl: "https://www.cronometer.com/",
            instructions: `Set up webhook to: ${cronUrl} with daily frequency`
          }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      message: "Cron job setup instructions generated",
      ...instructions
    });

  } catch (error: any) {
    console.error("[Cron Setup] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
