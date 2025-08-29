import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/issues';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        if (!token) return new NextResponse('Unauthorized', { status: 401 });
        
        const response = await axios.get(API_URL, {
            headers: { 'x-access-token': token }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data?.message || 'Error fetching issues', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}

// This is a public endpoint, no token needed
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await axios.post(API_URL, body);
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data?.message || 'Error reporting issue', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const body = await request.json();
        const response = await axios.delete(API_URL, {
            headers: { 'x-access-token': token || '' },
            data: body
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data?.message || 'Error deleting issues', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
