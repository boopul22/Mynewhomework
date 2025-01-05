import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change this in production

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful'
      });
    }

    return NextResponse.json({ 
      success: false,
      message: 'Invalid password'
    }, { 
      status: 401 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Authentication failed'
    }, { 
      status: 500 
    });
  }
} 