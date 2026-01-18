'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { BsPinAngleFill } from 'react-icons/bs';
import { FaLock } from "react-icons/fa";
import Post from '@/app/components/Post';
import PostForm from '@/app/components/PostForm';

export default function ThreadPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { boardCode, threadNumber } = use(params);
  
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenPosts, setHiddenPosts] = useState(new Set());
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

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/${boardCode}/threads/${threadNumber}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBoards();
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardCode, threadNumber]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [...prev, newPost]);
    setThread(prev => ({
      ...prev,
      replies: prev.replies + 1,
      images: prev.images + (newPost.imageUrl ? 1 : 0),
    }));
  };

  const togglePostVisibility = (postNumber) => {
    setHiddenPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postNumber)) {
        newSet.delete(postNumber);
      } else {
        newSet.add(postNumber);
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

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#000] p-8 text-center text-zinc-300">
        Thread not found
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
                /{boardCode}/&nbsp;
                <span className="text-zinc-400">
                  – {thread.subject || `Thread #${thread.threadNumber}`}
                </span>
              </h1>
            </div>
            <Link 
              href={`/${boardCode}`} 
              className="absolute left-4 top-4 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              [Return to Board]
            </Link>
          </div>

          {thread.isLocked && (
            <div className="mb-4 border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-center text-sm text-zinc-200">
              <strong className="font-semibold">Thread locked:</strong>{' '}
              <span className="text-zinc-400">No new replies can be posted.</span>
            </div>
          )}
        </div>

        {!thread.isLocked && (
          <div className="mb-6 flex justify-center">
            <PostForm 
              boardCode={boardCode} 
              threadNumber={threadNumber}
              onPostCreated={handlePostCreated}
            />
          </div>
        )}

        {/* OP Post + replies */}
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 shadow-sm">
          <div className="p-4">
            {/* OP header */}
            <div className="mb-2 flex items-center">
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
              <span className="font-semibold text-zinc-100">
                {thread.subject || `Thread #${thread.threadNumber}`}
              </span>
              <span className="ml-2 text-sm text-zinc-500">
                ({posts.length} replies, {thread.images} images)
              </span>
            </div>

            {/* OP body */}
            <Post post={thread} isOP={true} boardCode={boardCode} />

            {/* Replies section */}
            {posts.length > 0 && (
              <div className="mt-4 border-l-2 border-zinc-800 pl-4">
                <div className="mb-2 text-sm text-zinc-500">
                  {posts.length} {posts.length === 1 ? 'reply' : 'replies'}:
                </div>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Post 
                      key={post.postNumber}
                      post={post} 
                      boardCode={boardCode}
                      onToggleHide={() => togglePostVisibility(post.postNumber)}
                      isHidden={hiddenPosts.has(post.postNumber)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {posts.length} replies • {thread.images} images
        </div>
      </div>
    </div>
  );
}