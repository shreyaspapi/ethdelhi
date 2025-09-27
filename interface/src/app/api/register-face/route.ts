import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/register-face`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
