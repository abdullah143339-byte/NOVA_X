import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  sourceId: string;
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface RAGResult {
  answer: string;
  sources: { content: string; source: string; relevanceScore: number }[];
  confidence: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  // Simple TF-IDF-like vector store (production would use pgvector or Pinecone)
  private documentChunks: DocumentChunk[] = [];

  constructor(
    private prisma: PrismaService,
  ) {}

  // Index content into the RAG store
  async indexPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true } },
        comments: { select: { content: true, createdAt: true }, orderBy: { createdAt: 'asc' }, take: 20 },
      },
    });

    if (!post) return;

    const chunks = this.chunkText(post.content, 500);
    for (let i = 0; i < chunks.length; i++) {
      this.documentChunks.push({
        id: `${postId}-chunk-${i}`,
        content: chunks[i],
        source: 'post',
        sourceId: postId,
        metadata: {
          author: post.author.username,
          tags: post.tags,
          createdAt: post.createdAt.toISOString(),
          likesCount: post.reactionsCount,
        },
      });
    }

    // Also index comments as context
    for (let i = 0; i < post.comments.length; i++) {
      const comment = post.comments[i];
      if (comment.content.length > 20) {
        this.documentChunks.push({
          id: `${postId}-comment-${i}`,
          content: comment.content,
          source: 'comment',
          sourceId: postId,
          metadata: {
            author: 'community',
            context: `Comment on post: ${post.content.slice(0, 100)}`,
          },
        });
      }
    }

    this.logger.log(`Indexed ${chunks.length} chunks for post ${postId}`);
  }

  async indexCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) return;

    // Index course description
    if (course.description) {
      const chunks = this.chunkText(course.description, 500);
      for (let i = 0; i < chunks.length; i++) {
        this.documentChunks.push({
          id: `${courseId}-desc-${i}`,
          content: chunks[i],
          source: 'course',
          sourceId: courseId,
          metadata: {
            type: 'course_description',
            title: course.title,
            category: course.category,
          },
        });
      }
    }

    // Index lessons via separate query
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
    });
    for (const mod of modules) {
      const lessons = await this.prisma.lesson.findMany({
        where: { moduleId: mod.id },
      });
      for (const lesson of lessons) {
        if (lesson.content) {
          const chunks = this.chunkText(lesson.content, 500);
          for (let i = 0; i < chunks.length; i++) {
            this.documentChunks.push({
              id: `${lesson.id}-chunk-${i}`,
              content: chunks[i],
              source: 'lesson',
              sourceId: courseId,
              metadata: {
                type: 'lesson',
                lessonTitle: lesson.title,
                moduleTitle: mod.title,
                courseTitle: course.title,
              },
            });
          }
        }
      }
    }
  }

  // Search the RAG store
  async search(query: string, topK = 5): Promise<DocumentChunk[]> {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) return [];

    // Simple relevance scoring using term frequency
    const scored = this.documentChunks.map((chunk) => {
      const chunkTerms = this.tokenize(chunk.content);
      let score = 0;

      for (const term of queryTerms) {
        // Exact match
        const exactMatches = chunkTerms.filter((t) => t === term).length;
        score += exactMatches * 2;

        // Partial match
        const partialMatches = chunkTerms.filter((t) => t.includes(term) || term.includes(t)).length;
        score += partialMatches;

        // Title/metadata boost
        if (chunk.metadata.title?.toLowerCase().includes(term)) score += 3;
        if (chunk.metadata.tags?.toLowerCase().includes(term)) score += 2;
      }

      // Normalize by chunk length
      score = score / Math.sqrt(chunkTerms.length || 1);

      return { chunk, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({ ...s.chunk, relevanceScore: s.score } as any));
  }

  // RAG-enhanced response built from retrieved knowledge base matches
  async queryWithContext(query: string, userId?: string): Promise<RAGResult> {
    // Retrieve relevant context
    const relevantChunks = await this.search(query, 5);

    if (relevantChunks.length === 0) {
      return {
        answer: 'No relevant context found in the knowledge base for this query.',
        sources: [],
        confidence: 0,
      };
    }

    const responseContent =
      'Retrieved from the knowledge base:\n\n' +
      relevantChunks.map((c, i) => `${i + 1}. [${c.source}] ${c.content.slice(0, 200)}...`).join('\n\n');

    const topRelevance = Math.max(0, ...relevantChunks.map((c) => ((c as any).relevanceScore || 0)));
    const confidence = Math.round((1 - Math.exp(-topRelevance)) * 100) / 100;

    return {
      answer: responseContent,
      sources: relevantChunks.map((c) => ({
        content: c.content,
        source: c.source,
        relevanceScore: (c as any).relevanceScore || 0,
      })),
      confidence,
    };
  }

  // Auto-index all recent content
  async indexRecentContent() {
    const recentPosts = await this.prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { trendingScore: 'desc' },
      take: 100,
    });

    for (const post of recentPosts) {
      await this.indexPost(post.id);
    }

    this.logger.log(`RAG index rebuilt: ${this.documentChunks.length} chunks`);
    return { totalChunks: this.documentChunks.length };
  }

  getStats() {
    return {
      totalChunks: this.documentChunks.length,
      sources: [...new Set(this.documentChunks.map((c) => c.source))],
      lastIndexed: new Date().toISOString(),
    };
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    if (!text || text.length === 0) return [];

    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxChunkSize)];
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .filter((t) => !this.isStopWord(t));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'has',
      'have', 'will', 'would', 'could', 'should', 'may', 'might',
      'this', 'that', 'these', 'those', 'it', 'its', 'be', 'been',
      'are', 'was', 'were', 'from', 'by', 'as', 'do', 'did', 'does',
    ]);
    return stopWords.has(word);
  }
}
