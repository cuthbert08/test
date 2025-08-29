import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/admins';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-access-token');
    const response = await axios.get(API_URL, {
        headers: { 'x-access-token': token || '' }
    });
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
        return new NextResponse(error.response?.data || 'Error fetching admins', {
            status: error.response?.status || 500,
        });
    }
    return new NextResponse('An unexpected error occurred', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const body = await request.json();
        const response = await axios.post(API_URL, body, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data, { status: 201 });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error adding admin', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
