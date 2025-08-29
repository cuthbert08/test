import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/trigger-reminder';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const body = await request.json();
        const response = await axios.post(API_URL, body, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error triggering reminder', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
