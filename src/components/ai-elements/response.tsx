'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface ResponseProps {
  children: string;
  className?: string;
}

/**
 * Response component for rendering markdown content in AI assistant messages.
 * Mimics the AI SDK's Response component behavior with:
 * - GitHub Flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Smart streaming markdown parsing
 * - Theme-aware styling
 */
export const Response = memo(({ children, className }: ResponseProps) => {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom styling for code blocks
          code: ({ className, children, ...props }) => {
            // Check if this is inline code by checking if it has a language class
            const isInline = !className?.includes('language-');
            
            return isInline ? (
              <code
                className={cn(
                  'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
                  className
                )}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={cn('block', className)} {...props}>
                {children}
              </code>
            );
          },
          // Style links
          a: ({ children, ...props }) => (
            <a
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          // Style tables
          table: ({ children, ...props }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="border border-border px-4 py-2 text-left font-bold bg-muted"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-4 py-2 text-left" {...props}>
              {children}
            </td>
          ),
          // Style blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Style headings
          h1: ({ children, ...props }) => (
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="scroll-m-20 text-xl font-semibold tracking-tight" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="scroll-m-20 text-lg font-semibold tracking-tight" {...props}>
              {children}
            </h3>
          ),
          // Style lists
          ul: ({ children, ...props }) => (
            <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props}>
              {children}
            </ol>
          ),
          // Style paragraphs
          p: ({ children, ...props }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-4" {...props}>
              {children}
            </p>
          ),
          // Style pre blocks
          pre: ({ children, ...props }) => (
            <pre
              className="mb-4 mt-4 overflow-x-auto rounded-lg border bg-muted p-4"
              {...props}
            >
              {children}
            </pre>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});

Response.displayName = 'Response';
