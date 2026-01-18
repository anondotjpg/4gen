import { getAllBoards, createBoard } from '@/lib/db-operations';

export async function GET() {
  try {
    const boards = await getAllBoards();
    return Response.json(boards);
  } catch (error) {
    console.error('Failed to fetch boards:', error);
    return Response.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

/*
export async function POST(request) {
  try {
    const { code, name, description, isNSFW, maxFileSize, allowedFileTypes } = await request.json();
    
    const boardData = {
      code,
      name,
      description,
      isNSFW: isNSFW || false,
      maxFileSize: maxFileSize || 5 * 1024 * 1024, // 5MB default
      allowedFileTypes: allowedFileTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    };
    
    const board = await createBoard(boardData);
    return Response.json(board, { status: 201 });
    
  } catch (error) {
    console.error('Failed to create board:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return Response.json({ error: 'Board code already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
*/