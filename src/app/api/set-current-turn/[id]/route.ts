import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_BASE_URL = 'https://bin-reminder-app.vercel.app/api/set-current-turn';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('x-access-token');
        const response = await axios.post(`${API_BASE_URL}/${params.id}`, {}, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error setting current turn', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
