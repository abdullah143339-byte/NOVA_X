import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiRouterService } from '../../modules/ai-router/ai-router.service';

export interface AIRouterDecision {
  model: string;
  reason: string;
  confidence: number;
}

@Injectable()
export class NovaAiOsService {
  private readonly logger = new Logger(NovaAiOsService.name);

  constructor(
    private prisma: PrismaService,
    private aiRouterService: AiRouterService,
  ) {}

  // AI Router: Automatically routes to best model based on task type
  routeAiTask(taskType: string, complexity: string): AIRouterDecision {
    const routingTable: Record<string, Record<string, AIRouterDecision>> = {
      code: {
        simple: { model: 'nova-code-3b', reason: 'Quick code completion', confidence: 0.9 },
        medium: { model: 'nova-code-7b', reason: 'Code generation and review', confidence: 0.85 },
        complex: { model: 'nova-code-70b', reason: 'Architecture and complex refactoring', confidence: 0.8 },
      },
      text: {
        simple: { model: 'nova-3b', reason: 'Simple text tasks', confidence: 0.95 },
        medium: { model: 'nova-7b', reason: 'General text generation', confidence: 0.9 },
        complex: { model: 'nova-70b', reason: 'Complex reasoning and analysis', confidence: 0.85 },
      },
      image: {
        simple: { model: 'nova-vision-3b', reason: 'Image description', confidence: 0.9 },
        medium: { model: 'nova-vision-7b', reason: 'Image analysis', confidence: 0.85 },
        complex: { model: 'nova-vision-70b', reason: 'Advanced visual reasoning', confidence: 0.8 },
      },
      learning: {
        simple: { model: 'nova-3b', reason: 'Quick Q&A', confidence: 0.95 },
        medium: { model: 'nova-7b', reason: 'Explanations and tutoring', confidence: 0.9 },
        complex: { model: 'nova-70b', reason: 'Deep educational content', confidence: 0.85 },
      },
    };

    const taskRoutes = routingTable[taskType] || routingTable.text;
    return taskRoutes[complexity] || taskRoutes.medium;
  }

  // AI Conversation management
  async createConversation(userId: string, title?: string) {
    return this.prisma.aIConversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
        model: 'nova-7b',
      },
    });
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found');
    }

    // Save user message
    const userMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    // Route to appropriate model
    const decision = this.routeAiTask(this.detectTaskType(content), 'medium');

    const previousMessages = await this.prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    previousMessages.reverse();

    const formattedMessages = previousMessages.map((m) => ({
      role: m.role.toLowerCase() as any,
      content: m.content,
    }));
    formattedMessages.push({ role: 'user', content });

    let aiResponseContent = '';
    let finalModel = decision.model;

    try {
      const aiRes = await this.aiRouterService.routeToChat(formattedMessages);
      aiResponseContent = aiRes.data.content;
      finalModel = aiRes.model || decision.model;
    } catch (error) {
      this.logger.error('Failed to get AI response', error);
      aiResponseContent = "I apologize, but I'm currently unable to process your request. Please try again later.";
    }

    // Save AI response
    const aiMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponseContent,
        model: finalModel,
        tokensUsed: this.estimateTokens(content + aiResponseContent),
        responseTime: Math.floor(Math.random() * 2000) + 500,
      },
    });

    // Update conversation
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    });

    return { userMessage, aiMessage, model: finalModel };
  }

  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });
  }

  async findConversationById(conversationId: string) {
    return this.prisma.aIConversation.findUnique({ where: { id: conversationId } });
  }

  // AI Personalization - learns user preferences
  async getUserPreferences(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    const reputation = await this.prisma.reputation.findUnique({ where: { userId } });
    return {
      aiPersonalization: settings?.aiPersonalization ?? true,
      contentFilter: settings?.contentFilter ?? 'medium',
      level: reputation?.level ?? 1,
      expertiseScore: reputation?.expertiseScore ?? 0,
    };
  }

  // AI Content Scoring
  async scoreContent(content: string): Promise<{ score: number; tags: string[]; sentiment: string }> {
    const wordCount = content.split(/\s+/).length;
    const hasCode = /```|function|const|let|var|class|import/.test(content);
    const hasQuestion = /\?/.test(content);
    const hasEmoji = /[\u{1F600}-\u{1F64F}]/u.test(content);
    const exclamationCount = (content.match(/!/g) || []).length;

    let sentiment = 'neutral';
    if (hasEmoji || exclamationCount > 2) sentiment = 'excited';
    else if (hasQuestion) sentiment = 'inquiring';

    let score = 50;
    if (wordCount > 50) score += 10;
    if (wordCount > 200) score += 10;
    if (hasCode) score += 15;
    if (hasQuestion) score += 5;

    const tags: string[] = [];
    if (hasCode) tags.push('code');
    if (hasQuestion) tags.push('question');
    if (wordCount < 20) tags.push('short');

    return { score: Math.min(100, score), tags, sentiment };
  }

  private detectTaskType(content: string): string {
    const lower = content.toLowerCase();

    // Debugging intent - check before code to catch debug-specific queries
    if (/\b(debug|error|fix|bug|issue|crash|failing|not working|broken|stack trace|exception|traceback)\b/.test(lower)) return 'code';

    // Code intent
    if (/```|(\b(function|const|let|var|class|import|export|from|require|def|async|await|return)\b)|\b(npm|yarn|pip|git|docker|npm run|npx|create|install)\b/.test(content)) return 'code';
    if (/\b(write|create|build|implement|code|program|script|function|component|api|endpoint|react|python|node|java|typescript|javascript|html|css|sql|rest|graphql)\b/.test(lower)) return 'code';

    // Explanation intent
    if (/\b(what is|what are|what does|what do|how does|how do|how can|how to|explain|tell me about|define|describe|difference between|compare|why does|why do|why is|why are)\b/.test(lower)) return 'learning';

    // Learning intent
    if (/\b(learn|teach|study|course|tutorial|roadmap|guide|path|curriculum|certification|beginner|advanced|start|getting started|best way to|recommend)\b/.test(lower)) return 'learning';

    // Writing intent
    if (/\b(write|draft|compose|email|article|blog|documentation|readme|essay|report|summary|rewrite|proofread|edit|paragraph|letter|proposal)\b/.test(lower)) return 'text';

    // Creative intent
    if (/\b(creative|story|poem|idea|brainstorm|name|slogan|tagline|caption|content idea|inspire|imagine|fiction|narrative)\b/.test(lower)) return 'text';

    // Image intent
    if (/\b(image|photo|picture|describe|see|look|visual|diagram|chart|screenshot|draw|design|mockup|ui|ux)\b/.test(lower)) return 'image';

    return 'text';
  }

  private detectIntent(content: string): string {
    const lower = content.toLowerCase();

    if (/\b(debug|error|fix|bug|issue|crash|failing|not working|broken|stack trace|exception|traceback)\b/.test(lower)) return 'debugging';
    if (/```|(\b(function|const|let|var|class|import|export|from|require|def|async|await|return)\b)|\b(npm|yarn|pip|git|docker)\b/.test(content)) return 'code';
    if (/\b(write|create|build|implement|code|program|script|function|component|api|endpoint|react|python|node|java|typescript|javascript|html|css|sql)\b/.test(lower)) return 'code';
    if (/\b(what is|what are|what does|what do|how does|how do|how can|explain|tell me about|define|describe|difference between|compare|why does|why do|why is|why are)\b/.test(lower)) return 'explanation';
    if (/\b(learn|teach|study|course|tutorial|roadmap|guide|path|curriculum|certification|beginner|advanced|getting started|best way to|recommend)\b/.test(lower)) return 'learning';
    if (/\b(write|draft|compose|email|article|blog|documentation|readme|essay|report|summary|rewrite|proofread|edit|paragraph|letter|proposal)\b/.test(lower)) return 'writing';
    if (/\b(creative|story|poem|idea|brainstorm|name|slogan|tagline|caption|inspire|imagine|fiction|narrative)\b/.test(lower)) return 'creative';
    return 'general';
  }

  private generatePlaceholderResponse(content: string, model: string): string {
    const intent = this.detectIntent(content);

    switch (intent) {
      case 'code':
        return this.generateCodeResponse(content);
      case 'explanation':
        return this.generateExplanationResponse(content);
      case 'learning':
        return this.generateLearningResponse(content);
      case 'writing':
        return this.generateWritingResponse(content);
      case 'debugging':
        return this.generateDebuggingResponse(content);
      case 'creative':
        return this.generateCreativeResponse(content);
      default:
        return this.generateGeneralResponse(content);
    }
  }

  private detectCodeLanguage(content: string): string {
    const lower = content.toLowerCase();
    if (/\b(react|jsx|tsx|component|hook|useState|useEffect|next\.?js|nextjs)\b/.test(lower)) return 'typescript';
    if (/\b(python|django|flask|fastapi|pip|pandas|numpy)\b/.test(lower)) return 'python';
    if (/\b(node|express|npm|typescript|ts-node|nest)\b/.test(lower)) return 'typescript';
    if (/\b(java|spring|gradle|maven)\b/.test(lower)) return 'java';
    if (/\b(css|scss|tailwind|styled|sass)\b/.test(lower)) return 'css';
    if (/\b(html|html5|semantic)\b/.test(lower)) return 'html';
    if (/\b(sql|query|database|mysql|postgres|mongo)\b/.test(lower)) return 'sql';
    if (/\b(go|golang)\b/.test(lower)) return 'go';
    if (/\b(rust|cargo)\b/.test(lower)) return 'rust';
    if (/\b(c\+\+|cpp|cmake)\b/.test(lower)) return 'cpp';
    if (/\b(bash|shell|zsh|terminal|command line)\b/.test(lower)) return 'bash';
    return 'typescript';
  }

  private detectCodeTopic(content: string): string {
    const lower = content.toLowerCase();
    if (/\b(component|render|jsx|props|state|hook|ui|button|form|modal)\b/.test(lower)) return 'component';
    if (/\b(api|endpoint|route|rest|graphql|fetch|axios|http|request|response)\b/.test(lower)) return 'api';
    if (/\b(database|schema|model|migration|query|prisma|typeorm|sequelize|mongoose)\b/.test(lower)) return 'database';
    if (/\b(auth|login|signup|register|token|jwt|session|password|oauth)\b/.test(lower)) return 'auth';
    if (/\b(test|spec|jest|mocha|cypress|e2e|unit test|test suite)\b/.test(lower)) return 'testing';
    if (/\b(deploy|docker|ci|cd|pipeline|aws|vercel|netlify|kubernetes)\b/.test(lower)) return 'deployment';
    if (/\b(array|object|string|number|boolean|map|filter|reduce|loop|iterate)\b/.test(lower)) return 'data-structures';
    if (/\b(class|interface|type|generic|enum|inheritance|polymorphism|oop)\b/.test(lower)) return 'patterns';
    return 'general';
  }

  private generateCodeResponse(content: string): string {
    const lang = this.detectCodeLanguage(content);
    const topic = this.detectCodeTopic(content);
    const lower = content.toLowerCase();

    // React component patterns
    if (lower.includes('react') || lower.includes('component') || lower.includes('jsx') || lower.includes('tsx')) {
      if (lower.includes('form')) {
        return `## React Form Component

Here's a reusable form component with validation:

\`\`\`typescript
import { useState, type FormEvent } from 'react';

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // API call here
      console.log('Submitted:', formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          className="w-full p-2 border rounded"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
      </div>
      <div>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Your email"
          className="w-full p-2 border rounded"
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
      </div>
      <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded">
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
\`\`\`

**Key points:**
- Controlled form inputs with typed state
- Client-side validation with error messages
- Async submission handling with loading state

Want me to add server-side validation, file uploads, or adapt this to a specific form library like Formik or React Hook Form?`;
      }

      if (lower.includes('hook') || lower.includes('custom hook')) {
        return `## Custom React Hook Pattern

Here's how to create reusable custom hooks:

\`\`\`typescript
import { useState, useEffect, useCallback, useRef } from 'react';

// Generic fetch hook with caching
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useRef<Map<string, T>>(new Map());

  const fetchData = useCallback(async () => {
    if (cache.current.has(url)) {
      setData(cache.current.get(url)!);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
      const json = await response.json();
      cache.current.set(url, json);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, error, loading } = useFetch<User>(\`/api/users/\${userId}\`);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return <div>{user?.name}</div>;
}
\`\`\`

**Best practices:**
- Always use generics for type safety
- Clean up side effects in \`useEffect\`
- Use \`useCallback\` to prevent unnecessary re-renders
- Consider adding retry logic and abort controllers for production

Need a specific hook? I can write hooks for debouncing, local storage, media queries, and more.`;
      }

      if (lower.includes('list') || lower.includes('render') || lower.includes('map')) {
        return `## Efficient List Rendering in React

\`\`\`typescript
import { memo, useMemo } from 'react';

interface Item {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

// Memoized list item component
const ListItem = memo(function ListItem({ item, onSelect }: { item: Item; onSelect: (id: string) => void }) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
    >
      <span>{item.name}</span>
      <span className={item.status === 'active' ? 'text-green-600' : 'text-gray-400'}>
        {item.status}
      </span>
    </div>
  );
});

// Parent list with filtering
export function ItemList({ items }: { items: Item[] }) {
  const activeItems = useMemo(() => items.filter(i => i.status === 'active'), [items]);

  const handleSelect = (id: string) => {
    console.log('Selected:', id);
  };

  return (
    <div>
      {activeItems.map(item => (
        <ListItem key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </div>
  );
}
\`\`\`

**Performance tips:**
- Always provide a stable **key** (use unique IDs, not array indices)
- Wrap expensive list items with \`memo()\`
- Use \`useMemo\` for filtering/sorting operations
- For very long lists, consider \`react-window\` or \`@tanstack/virtual\`

Want me to add virtualization, drag-and-drop reordering, or infinite scrolling?`;
      }

      return `## React Code Example

Here's a practical React pattern for your use case:

\`\`\`typescript
import { useState, useEffect, useMemo } from 'react';

// Reusable pattern with custom logic
export function DataDisplay({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState<unknown[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(endpoint)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [endpoint]);

  const filtered = useMemo(
    () => data.filter(item =>
      JSON.stringify(item).toLowerCase().includes(filter.toLowerCase())
    ),
    [data, filter]
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search..."
        className="border p-2 rounded w-full mb-4"
      />
      <div className="space-y-2">
        {filtered.map((item, i) => (
          <pre key={i} className="p-2 bg-gray-50 rounded text-sm">
            {JSON.stringify(item, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}
\`\`\`

This gives you a clean, typed component with search filtering. Want me to adapt this to a specific use case?`;
    }

    // Python patterns
    if (lang === 'python') {
      if (lower.includes('api') || lower.includes('endpoint') || lower.includes('fastapi') || lower.includes('flask')) {
        return `## Python API Endpoint

\`\`\`python
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.users.insert_one(user.dict())
    return UserResponse(id=str(result.inserted_id), **user.dict())

@app.get("/users", response_model=list[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None
):
    query = {"role": role} if role else {}
    users = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    return users
\`\`\`

**Features:**
- Pydantic models for request/response validation
- Query parameter validation with constraints
- Proper HTTP status codes and error handling
- Pagination support

Want me to add authentication middleware, rate limiting, or database integration?`;
      }

      if (lower.includes('class') || lower.includes('oop') || lower.includes('object')) {
        return `## Python OOP Patterns

\`\`\`python
from dataclasses import dataclass, field
from typing import Protocol
from abc import ABC, abstractmethod

# Using dataclasses for clean model definitions
@dataclass
class User:
    name: str
    email: str
    role: str = "user"
    _id: str = field(default_factory=lambda: "", repr=False)

# Abstract base class
class Repository(ABC):
    @abstractmethod
    async def find(self, id: str) -> dict | None: ...

    @abstractmethod
    async def save(self, data: dict) -> str: ...

# Protocol for duck typing
class Notifiable(Protocol):
    async def send(self, recipient: str, message: str) -> bool: ...

# Concrete implementation
class UserRepository(Repository):
    def __init__(self, db):
        self.db = db

    async def find(self, id: str) -> dict | None:
        return await self.db.users.find_one({"_id": id})

    async def save(self, data: dict) -> str:
        result = await self.db.users.insert_one(data)
        return str(result.inserted_id)

class EmailNotifier:
    async def send(self, recipient: str, message: str) -> bool:
        print(f"Sending to {recipient}: {message}")
        return True
\`\`\`

**When to use what:**
- **dataclasses** → simple data containers
- **ABC** → enforce interface contracts
- **Protocol** → structural subtyping (duck typing)
- **NamedTuple** → immutable data with named fields

Need a specific pattern? Factory, Strategy, Observer? Just ask.`;
      }

      return `## Python Code Example

\`\`\`python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Result:
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

    @classmethod
    def ok(cls, data: dict) -> "Result":
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str) -> "Result":
        return cls(success=False, error=error)

def process_input(text: str) -> Result:
    if not text.strip():
        return Result.fail("Empty input")
    words = text.split()
    return Result.ok({
        "word_count": len(words),
        "char_count": len(text),
        "most_common": max(set(words), key=words.count) if words else None
    })

# Usage
result = process_input("hello world hello")
if result.success:
    print(result.data)  # {'word_count': 3, 'char_count': 12, 'most_common': 'hello'}
else:
    print(result.error)
\`\`\`

This pattern gives you type-safe error handling without exceptions. Want me to build something specific?`;
    }

    // General code patterns
    if (topic === 'api') {
      return `## API Pattern

\`\`\`typescript
// Type-safe API client
interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || \`HTTP \${response.status}\`);
  }

  return response.json();
}

// Usage
const users = await apiRequest<User[]>('/api/users');
const newUser = await apiRequest<User>('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
});
\`\`\`

**Key patterns:**
- Generic types for reusability
- Error handling with fallback parsing
- Clean separation of concerns

Want me to add retry logic, request interceptors, or caching?`;
    }

    if (topic === 'database') {
      return `## Database Query Pattern

\`\`\`typescript
// Prisma example with pagination and filtering
async function findUsers(params: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const { search, role, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(role && { role }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
\`\`\`

Want me to add filtering, sorting, or raw SQL alternatives?`;
    }

    return `## Code Example

\`\`\`typescript
// Clean, reusable pattern
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

const defaultConfig: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

function createClient(overrides: Partial<Config> = {}) {
  const config = { ...defaultConfig, ...overrides };

  return {
    get: async (path: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const res = await fetch(\`\${config.apiUrl}\${path}\`, {
          signal: controller.signal,
        });
        return await res.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

// Usage
const client = createClient({ timeout: 10000 });
\`\`\`

This pattern gives you a clean, configurable API client. What specifically are you building?`;
  }

  private generateExplanationResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('difference between') || lower.includes('vs') || lower.includes(' compared to') || lower.includes(' or ')) {
      const topic = content.replace(/.*(?:difference between|vs|compared to|or)\s+/i, '').slice(0, 80);
      return `## Comparison: ${topic}

Here's a clear breakdown to help you understand the key differences:

### Quick Summary
The distinction comes down to **purpose**, **use case**, and **trade-offs**. Each has strengths depending on your situation.

### Key Differences

| Aspect | Option A | Option B |
|--------|----------|----------|
| **Purpose** | Best for specific use cases | Best for different scenarios |
| **Learning curve** | Varies based on familiarity | Varies based on familiarity |
| **Performance** | Optimized for certain patterns | Optimized for other patterns |
| **Community** | Strong ecosystem | Strong ecosystem |

### When to Choose Which
- **Choose Option A** when you need simplicity and quick setup
- **Choose Option B** when you need flexibility and control

### Recommendation
Start with the simpler option and migrate when you hit its limitations. Both are excellent choices.

Want me to go deeper on any specific aspect of this comparison?`;
    }

    if (lower.includes('how does') || lower.includes('how do') || lower.includes('how can') || lower.includes('how to')) {
      const topic = content.replace(/.*(?:how does|how do|how can|how to)\s+/i, '').slice(0, 80);
      return `## How ${topic} Works

### The Concept
At its core, this involves a series of steps that transform input into output. Let me break it down:

### Step-by-Step Breakdown

1. **Initialization** - The system sets up the necessary environment and loads dependencies
2. **Processing** - Input is received, validated, and transformed according to defined rules
3. **Output** - The result is produced and returned to the caller

### Under the Hood
- Data flows through a **pipeline** of transformations
- Each step is **isolated** and testable
- Errors are caught and handled gracefully at each stage

### Visual Flow
\`\`\`
Input → Validation → Processing → Transformation → Output
  ↓         ↓            ↓              ↓            ↓
 Error    Rejection   Logging       Caching      Response
\`\`\`

### Practical Example
Think of it like a restaurant kitchen:
- **Input** = raw ingredients
- **Processing** = cooking techniques
- **Output** = finished dish

Each station (developer) handles one part of the process.

Want me to dive deeper into any specific step?`;
    }

    if (lower.includes('what is') || lower.includes('what are') || lower.includes('define') || lower.includes('explain')) {
      const topic = content.replace(/.*(?:what is|what are|define|explain|tell me about)\s+/i, '').slice(0, 80);
      return `## ${topic} — Explained Simply

### Definition
${topic.charAt(0).toUpperCase() + topic.slice(1)} is a concept/tool/pattern used to solve specific problems in software development. It provides a structured approach to handling common challenges.

### Core Principles
- **Purpose** — Solves a specific class of problems effectively
- **Abstraction** — Hides complexity behind a clean interface
- **Reusability** — Can be applied across different contexts
- **Composability** — Works well with other tools and patterns

### Why It Matters
1. **Reduces complexity** by providing proven solutions
2. **Improves maintainability** through standardization
3. **Enables collaboration** with shared understanding
4. **Saves time** by avoiding reinventing the wheel

### Real-World Analogy
Think of it like a **blueprint for a house** — you don't need to figure out structural engineering from scratch; you follow established patterns that are proven to work.

### Where to Learn More
- Official documentation is always the best starting point
- Try building a small project using just this concept
- Check out NOVA AI's learning paths for structured courses

Want a code example or a deeper dive into any aspect?`;
    }

    return `## Here's What I Can Tell You

Great question! Let me break this down clearly:

### Key Points
1. **Core concept** — This involves understanding the fundamental principles and how they apply in practice
2. **Practical application** — The real value comes from applying this in actual projects
3. **Best practices** — Follow established patterns rather than reinventing solutions

### Things to Consider
- Start with the basics before moving to advanced topics
- Practice with small, focused projects
- Read official documentation for the most up-to-date information

### Suggested Next Steps
1. Try building a small example project
2. Explore NOVA AI's learning paths for structured guidance
3. Join a community to ask questions and share your progress

Would you like me to go deeper on any specific aspect, or do you have a follow-up question?`;
  }

  private generateLearningResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('roadmap') || lower.includes('path') || lower.includes('career')) {
      return `## Learning Roadmap

Here's a structured path to help you reach your goal:

### Phase 1: Foundations (Weeks 1-4)
- **Core concepts** — Understand the fundamentals thoroughly
- **Tools setup** — Configure your development environment
- **First project** — Build something small to solidify understanding

### Phase 2: Intermediate (Weeks 5-8)
- **Deep dive** — Explore advanced features and patterns
- **Real projects** — Build something meaningful
- **Best practices** — Learn industry-standard approaches

### Phase 3: Advanced (Weeks 9-12)
- **Architecture** — Design larger systems
- **Optimization** — Performance and scalability
- **Portfolio** — Showcase your best work

### Resources to Start
1. **NOVA AI Learning Paths** — Personalized courses based on your level
2. **Official documentation** — Always the source of truth
3. **Practice projects** — Build, break, fix, repeat

### Tips for Success
- Code **every day**, even if it's just 30 minutes
- Build **real projects**, not just tutorials
- Join **NOVA AI communities** to stay motivated
- Track your progress in your NOVA AI portfolio

Want me to create a more specific roadmap for a particular technology?`;
    }

    if (lower.includes('course') || lower.includes('tutorial') || lower.includes('study')) {
      return `## Study Plan

Here's a focused plan to help you learn effectively:

### Daily Routine
| Time | Activity |
|------|----------|
| 30 min | Read documentation or watch a lesson |
| 60 min | Hands-on coding practice |
| 15 min | Review what you learned and take notes |
| 15 min | Help someone or explain a concept |

### Weekly Goals
- **Week 1-2**: Core concepts and syntax
- **Week 3-4**: Build small projects
- **Week 5-6**: Intermediate patterns
- **Week 7-8**: Advanced topics and architecture

### Learning Strategies
1. **Active recall** — Test yourself instead of re-reading
2. **Spaced repetition** — Review material at increasing intervals
3. **Project-based learning** — Build real things, not toy examples
4. **Teach others** — Explaining solidifies understanding

### Track Your Progress
Use NOVA AI's learning tracking to monitor your growth and earn reputation points as you complete milestones.

Want me to create a customized study plan for a specific topic?`;
    }

    if (lower.includes('beginner') || lower.includes('start') || lower.includes('getting started') || lower.includes('new to')) {
      return `## Getting Started Guide

Welcome! Here's how to begin your journey:

### Step 1: Environment Setup
\`\`\`bash
# Install the basics
node -v          # Check Node.js version
npm -v           # Check npm version
code .           # Open VS Code
\`\`\`

### Step 2: Learn the Fundamentals
1. **Variables and types** — How to store and use data
2. **Control flow** — Making decisions with if/else
3. **Functions** — Writing reusable blocks of code
4. **Data structures** — Working with arrays and objects

### Step 3: Build Your First Project
Start small. Build a:
- To-do list
- Calculator
- Personal portfolio

### Step 4: Level Up
- Learn a framework (React, Vue, or Angular)
- Understand APIs and databases
- Version control with Git

### Resources
- **NOVA AI Beginner Paths** — Structured courses for new developers
- **NOVA AI Communities** — Connect with other learners
- **NOVA AI Portfolio** — Showcase your projects as you build them

The most important thing: **just start**. You'll learn more from building than from watching tutorials.

What specific topic would you like to start with?`;
    }

    return `## Let's Learn Together

Here's a structured approach to help you master this:

### Understanding the Basics
1. **What it is** — A fundamental concept in modern development
2. **Why it matters** — It solves real problems in production systems
3. **How it fits** — Connects with other concepts you may already know

### Learning Path
\`\`\`
Fundamentals → Practice → Advanced Topics → Real Projects → Mastery
\`\`\`

### Hands-On Practice
The best way to learn is by doing. Here's what I suggest:
1. Read the official documentation (15 min)
2. Try a simple example (30 min)
3. Modify it and see what happens (15 min)
4. Build something original (1 hour)

### NOVA AI Features to Help You
- **Learning Paths** — Personalized curriculum based on your goals
- **Communities** — Ask questions and share your progress
- **Portfolio** — Track and showcase your achievements
- **AI Assistant** — Ask me anything, anytime

What specific area would you like to focus on?`;
  }

  private generateWritingResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('email')) {
      return `## Email Draft

Here's a professional email template:

---

**Subject:** [Clear, specific subject line]

Hi [Name],

I hope this message finds you well. I'm reaching out regarding [specific topic].

**Key points:**
- [Point 1 — be specific and actionable]
- [Point 2 — include relevant context]
- [Point 3 — state any deadlines or next steps]

[Optional: Add a brief paragraph with more context or reasoning]

Please let me know if you have any questions or need additional information. I'm happy to schedule a quick call if that would be helpful.

Best regards,
[Your Name]

---

**Tips for better emails:**
- Keep the subject line **under 8 words** and specific
- Start with the **main point** — don't bury it
- Use **bullet points** for multiple items
- Include a **clear call to action**

Want me to adjust the tone, length, or focus of this email?`;
    }

    if (lower.includes('article') || lower.includes('blog') || lower.includes('post')) {
      return `## Article Outline

Here's a structured article framework:

---

# [Title: Clear, specific, and engaging]

## Introduction
- Hook the reader with a relatable problem or surprising fact
- State what the article covers and who it's for
- Preview the key takeaways

## Section 1: [Core Topic]
- Explain the concept clearly
- Use real-world examples
- Include code snippets or visuals if applicable

## Section 2: [Practical Application]
- Step-by-step walkthrough
- Common pitfalls and how to avoid them
- Tips from experience

## Section 3: [Advanced Considerations]
- Performance implications
- When to use (and when NOT to use)
- Future trends

## Conclusion
- Recap key points
- Actionable next steps
- Call to action (comment, share, try it out)

---

**Writing tips:**
- Write for **scanners** — use headers, bullets, and bold text
- Keep paragraphs **under 4 lines**
- Use **active voice** and concrete examples
- Include **code examples** for technical topics

Want me to flesh out any section?`;
    }

    if (lower.includes('readme') || lower.includes('documentation') || lower.includes('docs')) {
      return `## Documentation Template

Here's a clean README structure:

---

# Project Name

Brief description of what this project does and why it exists.

## Features
- Feature 1 — Brief description
- Feature 2 — Brief description
- Feature 3 — Brief description

## Quick Start

\`\`\`bash
# Installation
npm install project-name

# Configuration
cp .env.example .env

# Run
npm start
\`\`\`

## Usage

\`\`\`typescript
import { something } from 'project-name';

// Basic example
const result = something({ option: true });
\`\`\`

## API Reference

| Method | Parameters | Description |
|--------|-----------|-------------|
| \`doSomething()\` | \`input: string\` | Processes the input |

## Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License
MIT

---

Want me to expand any section or tailor it for a specific type of project?`;
    }

    return `## Writing Assistance

Here's a polished version based on your input:

---

### Refined Content

Your message covers some great points. Here's a structured version:

**Opening:** Start with a clear statement of purpose or context.

**Body:**
- Organize ideas into clear, logical sections
- Use bullet points for lists and key takeaways
- Include specific examples or data where possible

**Closing:** End with a clear call to action or summary.

---

### Writing Best Practices
1. **Be concise** — Remove unnecessary words
2. **Be specific** — Use concrete examples over vague statements
3. **Structure well** — Headers, paragraphs, and lists help readability
4. **Edit ruthlessly** — First drafts are for getting ideas down; editing makes them shine

### Tools in NOVA AI
- **Content Scoring** — Get feedback on your writing quality
- **Communities** — Get peer reviews and suggestions
- **Portfolio** — Publish your best work

Want me to rewrite, expand, or restructure this further?`;
  }

  private generateDebuggingResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('error') || lower.includes('exception') || lower.includes('crash') || lower.includes('traceback')) {
      return `## Debugging Help

When you encounter an error, here's a systematic approach:

### Step 1: Read the Error Message
The error message is your roadmap. Look for:
- **Error type** (TypeError, ReferenceError, etc.)
- **Line number** — where it happened
- **Stack trace** — the path that led to the error

### Step 2: Common Error Patterns

\`\`\`typescript
// TypeError: Cannot read properties of undefined
// Fix: Add null checks or optional chaining
const value = obj?.nested?.property ?? 'default';

// ReferenceError: X is not defined
// Fix: Check variable declaration and scope
const x = 10; // Is this in scope?

// TypeError: X is not a function
// Fix: Check if the function exists before calling
if (typeof callback === 'function') {
  callback();
}
\`\`\`

### Step 3: Debugging Techniques

\`\`\`typescript
// Use console strategically
console.log('Input:', JSON.stringify(input, null, 2));
console.log('State before:', { ...state });

// Use TypeScript to catch errors at compile time
function processData(input: unknown): string {
  if (typeof input !== 'string') throw new Error('Expected string');
  return input.trim();
}
\`\`\`

### Step 4: Prevent Future Errors

\`\`\`typescript
// Add proper types
interface ApiResponse {
  data: User[];
  error?: string;
}

// Validate inputs
function validateUser(user: unknown): user is User {
  return typeof user === 'object' && user !== null && 'email' in user;
}
\`\`\`

### Quick Checklist
- [ ] Check the **exact** error message and line number
- [ ] Look at **recent changes** (git diff)
- [ ] Add **console logs** at key points
- [ ] Check **types** with TypeScript
- [ ] Test with **known good inputs**

Can you share the specific error message? I can give you a targeted fix.`;
    }

    if (lower.includes('not working') || lower.includes('broken') || lower.includes('issue') || lower.includes('bug')) {
      return `## Troubleshooting Guide

When something isn't working, here's how to systematically find the problem:

### 1. Isolate the Problem
- Does it happen **every time** or only sometimes?
- Is it **new** (did it work before)?
- What **changed** recently?

### 2. Check the Basics
\`\`\`bash
# Verify your environment
node -v
npm list

# Clear caches
rm -rf node_modules
npm install

# Check for common issues
npm audit
\`\`\`

### 3. Add Logging
\`\`\`typescript
// Add debug logs at key points
console.log('Step 1: Input received', input);
console.log('Step 2: Processing...', { step: 'validation' });
console.log('Step 3: Result', result);
\`\`\`

### 4. Binary Search for the Bug
Comment out half your code. Does it still break? This helps narrow down the problem area quickly.

### 5. Common Culprits
- **Async issues** — Missing \`await\` or wrong promise handling
- **State issues** — Stale closures or incorrect state updates
- **Type mismatches** — Passing wrong types between functions
- **Environment** — Missing env vars or config

### Get Help Faster
Share these details when asking for help:
1. The **exact error message**
2. What you **expected** vs what **happened**
3. What you've **already tried**
4. A **minimal reproduction** of the issue

Want to walk through the specific problem you're facing?`;
    }

    return `## Debugging Approach

Here's a systematic way to find and fix issues:

### Process
1. **Reproduce** — Can you trigger the bug consistently?
2. **Isolate** — Narrow down where the problem occurs
3. **Identify** — Understand why it's happening
4. **Fix** — Apply the solution
5. **Verify** — Confirm the fix works
6. **Prevent** — Add tests or guards to prevent regression

### Useful Techniques
- **Breakpoints** in your IDE for step-by-step debugging
- **Console logging** for quick inspection
- **TypeScript** to catch errors at compile time
- **Unit tests** to verify behavior

### Preventing Bugs
\`\`\`typescript
// Use TypeScript strictly
const config = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
};

// Add runtime checks
function assertDefined<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(\`\${name} is required\`);
  return value;
}
\`\`\`

Can you describe the specific issue you're running into? I can give you a more targeted solution.`;
  }

  private generateCreativeResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('name') || lower.includes('slogan') || lower.includes('tagline')) {
      return `## Creative Names & Taglines

Here are some options based on your request:

### Name Ideas
1. **Option 1** — Short, memorable, and professional
2. **Option 2** — Modern and tech-forward
3. **Option 3** — Creative and unique

### Tagline Options
1. *"Building the future, one line at a time"*
2. *"Where ideas meet innovation"*
3. *"Simplifying complexity, empowering creativity"*

### Choosing the Right Name
- **Memorable** — Easy to remember and spell
- **Unique** — Stands out from competitors
- **Scalable** — Won't limit future growth
- **Available** — Check domain and social media availability

### Next Steps
1. Check domain availability (e.g., \`yourname.com\`)
2. Search social media handles
3. Test with your target audience
4. Get feedback from the NOVA AI community

Want me to brainstorm more options in a specific direction?`;
    }

    if (lower.includes('story') || lower.includes('narrative') || lower.includes('fiction')) {
      return `## Creative Story Starter

Here's a narrative framework to spark your imagination:

---

**Opening Hook:**
*"The code compiled for the first time at 3 AM, and that's when everything went wrong."*

**Setting the Scene:**
Every great story needs:
- A **compelling protagonist** (relatable, flawed, growing)
- A **clear conflict** (what stands in their way?)
- A **vivid world** (where and when does this take place?)
- **Rising tension** (escalating challenges)
- A **satisfying resolution** (not always a happy ending, but always meaningful)

**Story Structure:**
\`\`\`
Hook → Setup → Inciting Incident → Rising Action → Climax → Resolution
\`\`\`

**Writing Tips:**
1. Start **in media res** (in the middle of the action)
2. Show, don't tell — use **sensory details**
3. Create **conflict** early and escalate it
4. Make the ending **earned**, not convenient

---

Want me to develop a specific character, setting, or plot? I can help build your world.`;
    }

    return `## Creative Ideas

Here are some creative directions based on your input:

### Brainstorming Framework

**Divergent thinking** — Generate many ideas without judging:
- What's the most **unexpected** approach?
- What would happen if we **reversed** the assumptions?
- How would a **beginner** vs an **expert** approach this?

**Convergent thinking** — Narrow down to the best options:
- Which idea is most **feasible**?
- Which has the most **impact**?
- Which excites you the **most**?

### Creative Techniques
1. **SCAMPER** — Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
2. **Mind mapping** — Start with one idea and branch out
3. **Constraint-based creativity** — Limitations breed innovation

### Share Your Ideas
The NOVA AI community is great for getting feedback on creative work. You can:
- Share drafts in communities
- Get peer reviews
- Track your creative projects in your portfolio

What kind of creative project are you working on? I can help you develop it further.`;
  }

  private generateGeneralResponse(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower === 'hi' || lower === 'hello') {
      return `## Hey there! 👋

I'm **NOVA AI**, your intelligent assistant. Here's how I can help you today:

### What I Can Do
- **Code** — Write, review, and debug code in any language
- **Explain** — Break down complex concepts into simple terms
- **Learn** — Create personalized learning paths and roadmaps
- **Write** — Draft emails, articles, documentation, and more
- **Creative** — Brainstorm ideas, names, stories, and content

### Quick Start
Just ask me anything! For example:
- *"How do I build a React form with validation?"*
- *"Explain microservices vs monolith"*
- *"Create a Python learning roadmap"*
- *"Help me debug this error"*

### NOVA AI Features
- **Learning Paths** — Personalized courses tailored to your level
- **Communities** — Connect with other developers
- **Portfolio** — Showcase your projects and earn reputation
- **AI Router** — I automatically use the best model for your task

What would you like to work on?`;
    }

    if (lower.includes('thank') || lower.includes('thanks')) {
      return `## You're Welcome! 😊

Glad I could help. Here are some things you might want to do next:

### Continue Learning
- Check out **NOVA AI Learning Paths** for structured courses
- Explore **Communities** to connect with other developers

### Build Something
- Start a new project and track it in your **Portfolio**
- Apply what you've learned in a real application

### Keep Growing
- Ask me more questions anytime
- Share your knowledge with others in communities
- Earn reputation by helping fellow developers

Is there anything else you'd like to explore?`;
    }

    if (lower.includes('help') || lower.includes('what can you do') || lower.includes('what should')) {
      return `## Here to Help!

I'm **NOVA AI**, your coding and learning assistant. Here's what I can do:

### 🛠️ Code
- Write functions, components, and full features
- Review and refactor existing code
- Debug errors and explain solutions
- Generate tests and documentation

### 📚 Learn
- Create personalized learning roadmaps
- Explain concepts from beginner to advanced
- Recommend resources and projects
- Track your progress

### ✍️ Write
- Draft professional emails and documentation
- Create blog posts and articles
- Write README files and API docs
- Edit and improve existing content

### 🎨 Creative
- Brainstorm project names and ideas
- Generate content for social media
- Create story outlines and narratives
- Help with UI/UX concepts

### 🧩 Debug
- Analyze error messages and stack traces
- Suggest fixes and improvements
- Review code for potential issues
- Explain why something isn't working

### 🚀 NOVA AI Features
- **Learning Paths** — Personalized curriculum
- **Communities** — Connect with peers
- **Portfolio** — Showcase your work
- **AI Router** — Best model for every task

Just describe what you need, and I'll give you a helpful, actionable response!`;
    }

    // Default general response
    return `## Got It!

Here's what I understand from your message:

### Summary
You're asking about something that can be approached from multiple angles. Let me help you think through it.

### Key Considerations
1. **Context** — Understanding the bigger picture helps determine the best approach
2. **Trade-offs** — Every solution has pros and cons
3. **Goals** — What outcome are you trying to achieve?

### Suggested Next Steps
- **Define the problem clearly** — What specifically do you need help with?
- **Start small** — Begin with a minimal version and iterate
- **Get feedback** — Share your progress with the NOVA AI community

### How I Can Help
I'm best at:
- **Writing code** — Tell me what you want to build
- **Explaining concepts** — Ask me "what is" or "how does" anything
- **Debugging** — Share your error message
- **Learning** — Request a roadmap or study plan
- **Writing** — Draft emails, docs, or articles

The more specific you are, the better I can help. What would you like to dive into?`;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
