import axios from 'axios';
import { NextResponse } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/skip-turn';

export async function POST() {
    try {
        const response = await axios.post(API_URL);
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error skipping turn', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
