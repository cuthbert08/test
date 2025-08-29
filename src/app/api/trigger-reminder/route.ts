import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = `${process.env.BACKEND_API_URL}/api/trigger-reminder`;

async function handler(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const cronSecret = request.headers.get('x-cron-secret');
        
        const headers: Record<string, string> = {};
        if (token) {
            headers['x-access-token'] = token;
        }
        if (cronSecret) {
            headers['x-cron-secret'] = cronSecret;
        }

        let response;
        if (request.method === 'GET') {
            // For cron jobs, which are typically GET requests
            response = await axios.get(API_URL, { headers });
        } else {
            // For manual triggers from the frontend, which are POST
            const body = await request.json().catch(() => ({})); 
            response = await axios.post(API_URL, body, { headers });
        }
        
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

    