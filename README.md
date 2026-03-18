# deadletter

**"보내지 못한 편지를 여기에 보내세요"**

익명 편지 교환 플랫폼. 절대 전달되지 않을 편지를 쓰면, 비슷한 감정의 낯선 사람이 읽고 답장합니다.

## Features

- **편지 쓰기**: 전 연인, 부모님, 과거의 나 등 11가지 카테고리
- **편지 매칭**: 보완 카테고리 자동 매칭 (부모 ↔ 자녀, 과거 ↔ 미래)
- **대리 답장**: "나는 네 엄마가 아니지만..." — 낯선 사람의 진짜 답장
- **하루 한 통**: 매일 랜덤 편지 한 통이 도착
- **익명 보장**: 개인정보 자동 필터링, 가입 불필요

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Animation**: Framer Motion
- **Deploy**: Vercel

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

## Database

```bash
# Apply schema to Supabase
npx supabase db push
```
