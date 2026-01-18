import { 
    getBoardByCode,     
    getThreadByNumber,     
    createPost,     
    incrementThreadStats,     
    incrementBoardPostCount,     
    getNextPostNumber,
    addReplyToParentPosts,
    validateReplyTargets
} from '@/lib/db-operations';
import { uploadImage } from '@/lib/imageUpload';
import { generateTripcode } from '@/lib/utils';

export async function POST(request, { params }) {
  try {
    // Fix 1: Await params before destructuring
    const { boardCode, threadNumber } = await params;
    
    const board = await getBoardByCode(boardCode);
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }
    
    const thread = await getThreadByNumber(boardCode, threadNumber);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }
    
    if (thread.isLocked) {
      return Response.json({ error: 'Thread is locked' }, { status: 403 });
    }
    
    const formData = await request.formData();
    const content = formData.get('content') || '';
    const author = formData.get('author') || 'Anonymous';
    const email = formData.get('email') || '';
    const tripcode_password = formData.get('tripcode_password') || '';
    const image = formData.get('image');
    
    if (!content && !image) {
      return Response.json({ error: 'Post must have content or image' }, { status: 400 });
    }
    
    // Check for >>OP in content and return helpful error
    if (content.includes('>>OP') || content.includes('>>op')) {
      return Response.json({ 
        error: 'No need to tag OP when replying to a thread. Your reply is automatically linked to the thread.' 
      }, { status: 400 });
    }
    
    const tripcode = generateTripcode(tripcode_password);
    
    let imageData = {};
    if (image && image.size > 0) {
      if (image.size > board.maxFileSize) {
        return Response.json({ error: 'File too large' }, { status: 400 });
      }
      
      if (!board.allowedFileTypes.includes(image.type)) {
        return Response.json({ error: 'File type not allowed' }, { status: 400 });
      }
      
      const postNumber = await getNextPostNumber();
      imageData = await uploadImage(image, boardCode, postNumber);
    }
    
    // Parse reply references from content
    const replyMatches = content.match(/>>(\d+)/g) || [];
    const replyToNumbers = replyMatches
      .map(match => parseInt(match.substring(2)))
      .filter(num => !isNaN(num)); // Only keep valid numbers
    
    // Check if user is trying to reply to the OP (thread number)
    if (replyToNumbers.includes(parseInt(threadNumber))) {
      return Response.json({ 
        error: 'No need to tag the original post when replying to a thread. Your reply is automatically part of the thread.' 
      }, { status: 400 });
    }
    
    // Additional validation: check for common invalid patterns
    const invalidPatterns = [
      />>OP/gi,
      />>op/gi,
      />>0/g,
      />>-\d+/g // negative numbers
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(content)) {
        return Response.json({ 
          error: 'Invalid reply format detected. Use >>123 to reply to post number 123, or no tag needed to reply to OP.' 
        }, { status: 400 });
      }
    }
    
    // Validate that the posts being replied to actually exist in this thread
    const validReplyToNumbers = await validateReplyTargets(boardCode, threadNumber, replyToNumbers);
    
    // Optional: Warn if some reply targets were invalid (but don't fail the post)
    if (replyToNumbers.length > validReplyToNumbers.length) {
      console.log(`Some reply targets were invalid in thread ${threadNumber}:`, {
        attempted: replyToNumbers,
        valid: validReplyToNumbers
      });
    }
    
    const postData = {
      boardCode,
      threadNumber: parseInt(threadNumber),
      content: content.substring(0, 2000),
      author: author.substring(0, 50),
      tripcode,
      email: email.substring(0, 100),
      replyTo: validReplyToNumbers, // Only use validated reply numbers
      ...imageData
    };
    
    const post = await createPost(postData);
    
    // Add this post's number to the replies array of parent posts
    await addReplyToParentPosts(boardCode, threadNumber, post.postNumber, validReplyToNumbers);
    
    // Fix 2: Only include numeric values for MongoDB increment
    const threadStats = {
      replies: 1
    };
    
    if (image) {
      threadStats.images = 1;
    }
    
    // Handle sage separately - don't include it in the increment operation
    const isSage = email.toLowerCase() === 'sage';
    
    await incrementThreadStats(boardCode, parseInt(threadNumber), threadStats, isSage);
    await incrementBoardPostCount(boardCode, 1);
    
    return Response.json(post, { status: 201 });
    
  } catch (error) {
    console.error('Post creation error:', error);
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }
}