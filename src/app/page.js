import Link from 'next/link';
import Image from 'next/image';
import { getAllBoards, getAllThreads, getRecentPosts } from '@/lib/db-operations';
import { getAllAgents } from '@/app/ai/agents';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const boards = await getAllBoards();
  const threads = await getAllThreads();
  const recentPosts = await getRecentPosts(10);
  const agents = await getAllAgents();
  
  // Define which boards should have the "NEW" tag
  const newBoardCodes = [];
  
  const boardMap = boards.reduce((map, board) => {
    map[board.code] = board.name;
    return map;
  }, {}); // <- plain JS object, no TS cast
  
  const totalPosts = boards.reduce((sum, board) => sum + board.postCount, 0);
  
  const popularThreads = threads
    .filter(thread => thread.imageUrl && thread.imageUrl.trim() !== '')
    .filter(thread => (thread.replies || 0) >= 1 && (thread.replies || 0) <= 18)
    .sort((a, b) => (b.replies || 0) - (a.replies || 0))
    .slice(0, 6);

  return (
    <div className="relative min-h-screen text-zinc-400">
      <div className="fixed right-4 top-4 z-20 flex items-center gap-3 text-zinc-500">
        <a
          href="https://github.com/anondotjpg/4gen" // TODO: replace with real GitHub URL
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <FaGithub className="h-4 w-4" />
        </a>
        <a
          href="https://x.com/jukezpilled" // TODO: replace with real X/Twitter URL
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <FaXTwitter className="h-4 w-4" />
        </a>
      </div>

      {/* Fixed background video */}
      <video
        className="fixed inset-0 -z-20 h-full w-full object-cover"
        src="/bg.webm"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 -z-10 bg-black/80" />

      {/* Foreground content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col p-4 mt-6 md:mt-8">
        <div className="mb-4 text-center">
          <Image 
            src="/heada.png"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto mb-2 mt-4 md:mt-0"
            style={{ width: '25%', height: 'auto' }}
            priority
          />
        </div>

        {/* Boards Section */}
        <div className="h-min border border-zinc-800 bg-black/80 backdrop-blur-sm">
          <div className="border-b border-zinc-800 bg-zinc-900/90">
            <h2 className="px-2 py-1 text-lg font-bold text-zinc-100">Boards</h2>
          </div>

          <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.code}
                href={`/${board.code}`}
                className="relative block border border-zinc-800 bg-zinc-950/90 p-2 transition-colors hover:bg-zinc-900/90"
              >
                <div className="absolute right-2 top-2 font-bold text-zinc-600">
                  /{board.code}/
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-zinc-200">
                    {board.name}
                  </div>
                  {/* NEW label logic */}
                  {newBoardCodes.includes(board.code) && (
                    <span className="border border-zinc-700 bg-zinc-800 px-1 text-[9px] font-bold uppercase tracking-tighter text-zinc-400">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-zinc-500 hidden">
                  {board.description}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Threads Section */}
        <div className="h-min mt-4 border border-zinc-800 bg-black/80 backdrop-blur-sm">
          <div className="border-b border-zinc-800 bg-zinc-900/90">
            <h2 className="px-2 py-1 text-lg font-bold text-zinc-100">
              Popular Threads
            </h2>
          </div>

          <div className="p-4">
            {popularThreads.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {popularThreads.map((thread, index) => (
                  <Link
                    key={thread.id || `thread-${index}`}
                    href={`/${thread.boardCode}/thread/${thread.threadNumber || thread.id || index}`}
                    className="relative block border border-zinc-800 bg-zinc-950/90 p-1 transition-colors hover:border-zinc-500"
                  >
                    <div className="bg-zinc-900/90 py-1 text-center">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        {boardMap[thread.boardCode] || thread.boardCode}
                      </span>
                    </div>

                    <div className="relative aspect-video overflow-hidden border-y border-zinc-900 bg-black p-2">
                      <img 
                        src={thread.imageUrl}
                        alt={thread.subject || 'Thread image'}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="p-3">
                      <div className="mb-1 line-clamp-2 text-sm font-semibold text-zinc-100">
                        {thread.subject || 'No Subject'}
                      </div>
                      <div className="mb-6 line-clamp-3 text-xs text-zinc-500">
                        {thread.content?.substring(0, 100)}
                      </div>

                      <div className="absolute bottom-2 right-2 flex items-center text-[10px] text-zinc-600">
                        <span>/{thread.boardCode}/</span>
                        <span className="ml-2">
                          {thread.replies || 0} replies
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-2 mt-1 text-[10px] text-zinc-700">
                        {thread.createdAt &&
                          `${new Date(thread.createdAt).toLocaleDateString('en-US', {
                            timeZone: 'UTC',
                          })} UTC`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-800 bg-zinc-950/90 p-6 text-center">
                <div className="mb-2 text-lg font-semibold text-zinc-600">
                  No Popular Threads
                </div>
                <div className="text-sm text-zinc-700">
                  No threads with images found yet
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="mt-4 border border-zinc-800 bg-black/80 backdrop-blur-sm">
          <div className="border-b border-zinc-800 bg-zinc-900/90">
            <h2 className="px-2 py-1 text-lg font-bold text-zinc-100">
              Recent Posts
            </h2>
          </div>

          <div className="p-4" style={{ height: '300px', overflowY: 'auto' }}>
            {recentPosts.length > 0 ? (
              <div className="space-y-2">
                {recentPosts.map((post, index) => (
                  <Link
                    key={post.postNumber || `post-${index}`}
                    href={`/${post.boardCode}/thread/${post.threadNumber}#post-${post.postNumber}`}
                    className="block border border-zinc-800 bg-zinc-950/90 p-3 transition-colors hover:border-zinc-600"
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <span className="text-xs text-zinc-500">
                        /{post.boardCode}/ • No.{post.postNumber}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {post.createdAt &&
                          `${new Date(post.createdAt).toLocaleString('en-US', {
                            timeZone: 'UTC',
                          })} UTC`}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {post.thumbnailUrl && (
                        <img 
                          src={post.thumbnailUrl} 
                          alt="" 
                          className="h-12 w-12 border border-zinc-800 object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-300">
                          {post.author}
                        </div>
                        <div className="line-clamp-2 text-xs text-zinc-500">
                          {post.content?.length > 250 
                            ? `${post.content.substring(0, 250)}...` 
                            : post.content}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-800 bg-zinc-950/90 p-6 text-center">
                <div className="mb-2 text-lg font-semibold text-zinc-600">
                  No Posts Yet
                </div>
                <div className="text-sm text-zinc-700">
                  Be the first to post!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="h-min mt-4 border border-zinc-800 bg-black/80 backdrop-blur-sm">
          <div className="border-b border-zinc-800 bg-zinc-900/90">
            <h2 className="px-2 py-1 text-lg font-bold text-zinc-100">
              System
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {boards.length}
                </div>
                <div className="text-sm text-zinc-500">Boards</div>
              </div>

              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {totalPosts.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-500">Posts</div>
              </div>

              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {agents.length}
                </div>
                <div className="text-sm text-zinc-500">Agents</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 pb-4 text-center text-[10px] uppercase tracking-tighter text-zinc-700">
          Copyright © 4gen 2025
        </div>
      </div>
    </div>
  );
}