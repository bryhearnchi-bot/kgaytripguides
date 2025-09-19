# Claude Code Agents Guide for K-GAY Travel Guides

## Quick Start

Your project now has access to **100+ specialized agents** optimized for your travel guide application.

## 🎯 Priority Agents for Your Project

### UI/UX & Frontend
- **ui-ux-designer** - Mobile UX, accessibility, user flows
- **ui-visual-validator** - Visual testing, cross-browser checks
- **frontend-developer** - React, TypeScript, state management
- **mobile-developer** - Mobile-first, responsive design

### Backend & Data
- **database-optimizer** - Supabase query optimization
- **backend-architect** - API design, scalability
- **api-documenter** - API documentation

### Security & Testing
- **security-auditor** - Auth security, RLS policies
- **test-automator** - E2E, component tests
- **performance-engineer** - Load times, bundle optimization

## 📋 Common Tasks & Agent Combinations

### 1. Mobile Optimization
```
Agents: mobile-developer + ui-ux-designer
Task: "Optimize the cruise guide pages for mobile devices"
```

### 2. Database Performance
```
Agents: database-optimizer + backend-architect
Task: "Optimize Supabase queries for faster load times"
```

### 3. Security Audit
```
Agents: security-auditor + test-automator
Task: "Review authentication and data security"
```

### 4. Performance Boost
```
Agents: performance-engineer + frontend-developer
Task: "Reduce bundle size and improve load times"
```

### 5. Content & SEO
```
Agents: seo-content-writer + ui-ux-designer
Task: "Improve port descriptions and travel content"
```

## 🚀 How to Use Agents

Simply mention the task type and Claude will automatically invoke the right agents:

- "Review the mobile experience" → Invokes mobile-developer
- "Audit our security" → Invokes security-auditor
- "Optimize database queries" → Invokes database-optimizer
- "Improve page performance" → Invokes performance-engineer

## 📍 Agent Locations

All agents are installed at: `~/.claude/agents/`

- **wshobson/agents**: 48+ production agents
- **davila7/templates**: 100+ templates and commands
- **0xfurai/subagents**: 100+ modular agents

## 🔧 Project-Specific Configuration

Configuration file: `.claude-agents.yaml`

This file contains:
- Priority agents for your project
- Use case mappings
- Quick commands
- Testing requirements
- Workflow guidelines

## 💡 Best Practices

1. **Use multiple agents** for complex tasks
2. **Combine UI/UX agents** with frontend-developer for best results
3. **Always run security-auditor** before deployments
4. **Use test-automator** after major changes
5. **Invoke performance-engineer** for optimization

## 📊 Testing Requirements

Before committing:
```bash
npm run test:run     # Unit tests
npm run test:e2e     # E2E tests
npm run check        # TypeScript
```

## 🎨 UI Preservation Rules

The agents will respect your existing:
- Ocean-themed gradients
- Headers and navigation
- Tab ordering
- Mobile breakpoints (375px, 768px, 1024px)

## 🔐 Security Focus Areas

Agents will prioritize:
- Supabase Auth security
- RLS (Row Level Security) policies
- SQL injection prevention
- XSS protection
- Data privacy

## 📱 Mobile Priorities

Agents optimize for:
- Touch interactions
- Viewport responsiveness
- Performance on mobile networks
- PWA capabilities

---

**Need help?** Just ask: "Which agent should I use for [task]?"