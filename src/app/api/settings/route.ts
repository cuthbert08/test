import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = `${process.env.BACKEND_API_URL}/api/settings`;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-access-token');
    const response = await axios.get(API_URL, {
        headers: { 'x-access-token': token || '' }
    });
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
        return new NextResponse(error.response?.data?.message || 'Error fetching settings', {
            status: error.response?.status || 500,
        });
    }
    return new NextResponse('An unexpected error occurred', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const body = await request.json();
        const response = await axios.put(API_URL, body, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data?.message || 'Error updating settings', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
