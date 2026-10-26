'use client';

import { useState } from 'react';
import { Facebook, Heart, Link2, Linkedin, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ArticleEngagementProps = {
  className?: string;
  title?: string;
};

const shareUrl = (): string => (typeof window !== 'undefined' ? window.location.href : '');

export const ArticleEngagement = ({ className, title = '' }: ArticleEngagementProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [copied, setCopied] = useState(false);

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl());
  const encodedTitle = encodeURIComponent(title);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-y border-border py-3',
        className
      )}
      data-testid="article-engagement"
    >
      <button
        type="button"
        onClick={handleLike}
        className={cn(
          'inline-flex items-center gap-2 rounded-default px-3 py-1.5 text-sm font-medium transition-colors',
          liked
            ? 'bg-secondary/15 text-secondary'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike article' : 'Like article'}
      >
        <Heart className={cn('size-4', liked && 'fill-current')} aria-hidden="true" />
        <span>{likeCount}</span>
        <span className="sr-only sm:not-sr-only sm:inline">{liked ? 'Liked' : 'Like'}</span>
      </button>

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground mr-1 hidden items-center gap-1 text-xs font-semibold tracking-wide uppercase sm:inline-flex">
          <Share2 className="size-3.5" aria-hidden="true" />
          Share
        </span>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-default transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="size-4" />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-default transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="size-4" />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-default transition-colors"
          aria-label="Share on X"
        >
          <span className="text-sm font-bold leading-none">𝕏</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-default transition-colors"
          aria-label={copied ? 'Link copied' : 'Copy link'}
        >
          <Link2 className="size-4" />
        </button>
        {copied ? (
          <span className="text-secondary text-xs font-medium" role="status">
            Copied
          </span>
        ) : null}
      </div>
    </div>
  );
};
