import axios from 'axios';
import { NextResponse } from 'next/server';

const API_URL = `${process.env.BACKEND_API_URL}/api/auth/login`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await axios.post(API_URL, body);
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data?.message || 'Error logging in', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
