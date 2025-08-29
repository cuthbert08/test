import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/advance-turn';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('x-access-token');
        const response = await axios.post(API_URL, {}, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error advancing turn', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
