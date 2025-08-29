import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/issues';

// This is a public endpoint, no token needed
export async function GET(request: NextRequest) {
    try {
        // We call the public endpoint on the external service
        const response = await axios.get(API_URL);
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
