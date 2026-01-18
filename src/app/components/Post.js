'use client';

import { parseContent, formatFileSize, truncateFilename } from '@/lib/utils';
import { useState } from 'react';

export default function Post({ post, isOP = false, boardCode, onToggleHide, isHidden }) {
  const [imageExpanded, setImageExpanded] = useState(false);
  
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    if (d.toDateString() === today) {
      return 'Today ' + d.toLocaleTimeString();
    } else if (d.toDateString() === yesterday) {
      return 'Yesterday ' + d.toLocaleTimeString();
    } else {
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    }
  };

  const getPostNumber = () => {
    return post.postNumber || post.threadNumber;
  };

  const scrollToPost = (postNumber) => {
    const element = document.getElementById(`post-${postNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect (dark mode version)
      element.classList.add('bg-[#3a3a3c]');
      setTimeout(() => {
        element.classList.remove('bg-[#3a3a3c]');
      }, 1000);
    }
  };

  // Check if content contains greentext (lines starting with >)
  const hasGreentext = (content) => {
    if (!content) return false;
    return content.split('\n').some(line => line.trim().startsWith('>'));
  };

  const isAdmin = post.author === 'mogadmin';

  return (
    <div 
      className={`mb-2 transition-colors duration-300 ${isOP ? 'bg-[#2d2d2f] p-1 rounded-sm' : ''}`} 
      id={`post-${getPostNumber()}`}
    >
      <div className="mb-0">
        <div className="flex items-center">
          <span className={`font-bold ${isAdmin ? 'text-purple-400' : 'text-[#9b9b9b]'}`}>
            {isAdmin ? 'admin' : post.author}
          </span>
          {isAdmin && (
            <img 
              src="/admin.png" 
              alt="Admin" 
              className="w-4 ml-1"
            />
          )}
          {post.tripcode && (
            <span className="text-[#8ab4f8] font-bold ml-1">{post.tripcode}</span>
          )}
        </div>
        <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}(EST)</span>
        <span className="text-gray-500 ml-2 text-sm">No. {getPostNumber()}</span>
        
        {/* Display reply numbers */}
        {post.replies?.length > 0 && (
          <span className="text-[#8ab4f8] ml-2 text-sm">
            {post.replies.map((replyNumber, index) => (
              <span key={replyNumber}>
                <button
                  onClick={() => scrollToPost(replyNumber)}
                  className="hover:underline cursor-pointer text-[#8ab4f8] hover:text-[#aecbfa] transition-colors"
                  title={`Jump to post ${replyNumber}`}
                >
                  &gt;&gt;{replyNumber}
                </button>
                {index < post.replies.length - 1 && ' '}
              </span>
            ))}
          </span>
        )}

        {/* Hide/show toggle - only shown if onToggleHide is provided */}
        {onToggleHide && (
          <button
            onClick={onToggleHide}
            className="text-gray-500 hover:text-gray-300 ml-2 text-sm cursor-pointer transition-colors"
            title={isHidden ? "Show post" : "Hide post"}
          >
            [{isHidden ? '+' : '−'}]
          </button>
        )}
      </div>

      {/* Only show content if not hidden */}
      {!isHidden && (
        <div className="flex">
          {(post.imageUrl || post.thumbnailUrl) && (
            <div className="mr-4 mb-2">
              <div className="text-xs text-gray-500 mb-1">
                File: {truncateFilename(post.imageName)} ({formatFileSize(post.fileSize)})
              </div>
              <div 
                className="cursor-pointer"
                onClick={() => setImageExpanded(!imageExpanded)}
              >
                {imageExpanded ? (
                  <img
                    src={post.imageUrl}
                    alt={post.imageName}
                    className="max-h-40 max-w-40 md:max-h-64 md:max-w-64 border border-[#404040] rounded-sm"
                  />
                ) : (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.imageName}
                    className="border border-[#404040] max-w-32 max-h-32 rounded-sm"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
            {post.content && (
              <div 
                className={`text-sm break-words whitespace-pre-wrap text-gray-300 ${
                  hasGreentext(post.content) ? 'leading-[1.2]' : 'leading-[1.2]'
                }`}
                dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}