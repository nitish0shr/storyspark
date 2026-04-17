-- Starmee Migration 003: Fix books.status CHECK to include pending_review
-- The book pipeline writes status='pending_review' (src/services/book-pipeline.ts)
-- after generation so admins can approve before customer delivery.
-- The original constraint in 001 does NOT include pending_review, so inserts fail
-- silently in production.

alter table public.books drop constraint if exists books_status_check;

alter table public.books add constraint books_status_check check (
  status in (
    'draft',
    'preview_generating',
    'preview_ready',
    'generating',
    'pending_review',
    'approved',
    'complete',
    'failed'
  )
);
