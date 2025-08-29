import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = `${process.env.BACKEND_API_URL}/api/trigger-reminder`;

async function handler(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const cronSecret = request.headers.get('x-cron-secret');
        // Try to get body, but don't fail if it's a GET request with no body
        const body = await request.json().catch(() => ({})); 

        const headers: Record<string, string> = {};
        if (token) {
            headers['x-access-token'] = token;
        }
        if (cronSecret) {
            headers['x-cron-secret'] = cronSecret;
        }

        const response = await axios.post(API_URL, body, { headers });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || error.response?.data || 'Error triggering reminder';
            return NextResponse.json({ message }, { status });
        }
        return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
    }
}

export { handler as GET, handler as POST };
