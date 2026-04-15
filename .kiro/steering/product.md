# Product: SMAUII Developer Foundation

**Live:** https://lab.smauiiyk.sch.id  
**Repo:** SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io

## What It Is

A membership platform for SMA UII Yogyakarta students who are serious about technology. It's not just a club site — it manages member registration, approval, digital member cards, activity tracking, and announcements for a developer community.

## Core User Roles

- **member** — registered and approved student; can view dashboard, profile, card, activities, projects
- **maintainer** — admin/teacher; can approve members, manage announcements, view all members and stats
- **pending** — registered but not yet approved; limited access, redirected to check-status page

## Member Tracks

Robotika/IoT, AI, Data Science, Jaringan Komputer, Keamanan Siber, Software Engineering

## Key Flows

1. **Registration** — multi-step form: NISN verification via SLiMS → fill data → select tracks → confirm
2. **Approval** — maintainer approves pending members; triggers member card generation
3. **Auth** — email/password login or GitHub OAuth; session-based via Lucia
4. **Dashboard** — role-based: maintainer sees stats + pending approvals; member sees profile + card + activities

## Language

UI and content are in **Bahasa Indonesia**.
