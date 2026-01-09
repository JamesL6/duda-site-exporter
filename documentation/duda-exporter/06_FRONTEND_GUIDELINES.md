# Frontend Guidelines

## Directory Structure
```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx       # Auth Guard
│   └── page.tsx         # Main Interface
└── components/
    ├── job-input.tsx
    ├── progress-bar.tsx
    └── job-history.tsx
```

## Component Pattern
```typescript
'use client';

import { useState } from 'react';

export function JobInput() {
  const [url, setUrl] = useState('');
  
  const handleSubmit = async () => {
    // API Call
  };

  return (
    <div className="flex gap-2">
      <input value={url} onChange={e => setUrl(e.target.value)} />
      <button onClick={handleSubmit}>Scrape</button>
    </div>
  );
}
```
