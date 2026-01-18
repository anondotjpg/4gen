'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { BsPinAngleFill } from 'react-icons/bs';
import { FaLock } from "react-icons/fa";
import Post from '../components/Post';
import PostForm from '../components/PostForm';

export default function BoardPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { boardCode } = use(params);
  
  const [board, setBoard] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hiddenThreads, setHiddenThreads] = useState(new Set());
  const [allBoards, setAllBoards] = useState([]);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      if (response.ok) {
        const boards = await response.json();
        setAllBoards(boards);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  };

  const fetchThreads = async (pageNum = 1, append = false) => {
    try {
      const response = await fetch(`/api/${boardCode}/threads?page=${pageNum}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data.board);
        
        // Sort threads: pinned posts first, then by replies in descending order
        const sortedThreads = data.threads.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.replies - a.replies;
        });
        
        setThreads(prev => append ? [...prev, ...sortedThreads] : sortedThreads);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBoards();
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardCode]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchThreads(page + 1, true);
    }
  };

  const handleThreadCreated = () => {
    fetchThreads(); // Refresh the thread list
  };

  const toggleThreadVisibility = (threadNumber) => {
    setHiddenThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadNumber)) {
        newSet.delete(threadNumber);
      } else {
        newSet.add(threadNumber);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#000]">
        <img
          src="/load.gif"
          alt="Loading..."
          className="h-24 w-24"
        />
      </div>
    );
  }  

  if (!board) {
    return (
      <div className="min-h-screen bg-[#000] p-8 text-center text-zinc-300">
        Board not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] text-zinc-100">
      <div className="mx-auto max-w-sm px-4 pb-4 md:max-w-5xl">
        {/* Top center board links */}
        <div className="invisible pt-2 mb-4 text-center md:mb-6 md:visible">
          <div className="text-sm text-zinc-500">
            [
            {allBoards.map((b, index) => (
              <span key={b.code}>
                <Link
                  href={`/${b.code}`}
                  title={`${b.name}${b.description ? ` - ${b.description}` : ''}`}
                  className={`font-mono transition-colors ${
                    b.code === boardCode
                      ? 'text-emerald-400 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {b.code}
                </Link>
                {index < allBoards.length - 1 && (
                  <span className="text-zinc-600"> / </span>
                )}
              </span>
            ))}
            ]
          </div>
        </div>

        <div className="pt-4 mb-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
                /{board.code}/&nbsp;
                <span className="text-zinc-400">– {board.name}</span>
              </h1>
              {board.description && (
                <p className="mt-1 hidden text-sm text-zinc-500 md:block">
                  {board.description}
                </p>
              )}
            </div>
            <Link 
              href="/" 
              className="absolute left-4 top-4 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              [Return to Boards]
            </Link>
          </div>
        </div>

        {/* New thread form */}
        <div className="mb-6 flex justify-center">
          <PostForm 
            boardCode={boardCode} 
            onPostCreated={handleThreadCreated}
          />
        </div>

        {/* Threads */}
        <div className="space-y-6">
          {threads.map((thread) => {
            const isHidden = hiddenThreads.has(thread.threadNumber);
            
            return (
              <div 
                key={thread.threadNumber} 
                className="rounded-md border border-zinc-800 bg-zinc-900/80 shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <button
                      onClick={() => toggleThreadVisibility(thread.threadNumber)}
                      className="mr-2 mt-0.5 cursor-pointer select-none font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                      title={isHidden ? "Show thread content" : "Hide thread content"}
                    >
                      [{isHidden ? '+' : '−'}]
                    </button>
                    
                    <div className="flex-1">
                      {thread.isPinned && (
                        <BsPinAngleFill 
                          className="mr-2 inline text-emerald-400" 
                          size={16} 
                          title="Pinned" 
                        />
                      )}
                      {thread.isLocked && (
                        <FaLock 
                          className="mr-2 inline text-zinc-500" 
                          size={14} 
                          title="Locked" 
                        />
                      )}
                      <Link 
                        href={`/${boardCode}/thread/${thread.threadNumber}`}
                        className="font-semibold text-emerald-300 hover:text-emerald-200"
                      >
                        {thread.subject || `Thread #${thread.threadNumber}`}
                      </Link>
                      <span className="ml-2 text-sm text-zinc-500">
                        ({thread.replies} replies, {thread.images} images)
                      </span>
                      <Link
                        href={`/${boardCode}/thread/${thread.threadNumber}`}
                        className="ml-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        [reply]
                      </Link>
                    </div>
                  </div>

                  {!isHidden && (
                    <>
                      <Post post={thread} isOP={true} boardCode={boardCode} />

                      {thread.recentPosts && thread.recentPosts.length > 0 && (
                        <div className="mt-4 border-l-2 border-zinc-800 pl-4">
                          <div className="mb-2 text-sm text-zinc-500">
                            Recent replies:
                          </div>
                          {thread.recentPosts.map((post) => (
                            <div key={post.postNumber} className="mb-2">
                              <Post post={post} boardCode={boardCode} />
                            </div>
                          ))}
                          {thread.replies > 5 && (
                            <Link
                              href={`/${boardCode}/thread/${thread.threadNumber}`}
                              className="text-sm text-emerald-300 hover:text-emerald-200"
                            >
                              View all {thread.replies} replies →
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 px-6 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Threads'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}