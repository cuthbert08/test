import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

const API_URL = 'https://bin-reminder-app.vercel.app/api/residents';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('x-access-token');
        const body = await request.json();
        const response = await axios.put(`${API_URL}/${params.id}`, body, {
            headers: { 'x-access-token': token || '' }
        });
        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error updating resident', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('x-access-token');
        await axios.delete(`${API_URL}/${params.id}`, {
            headers: { 'x-access-token': token || '' }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return new NextResponse(error.response?.data || 'Error deleting resident', {
                status: error.response?.status || 500,
            });
        }
        return new NextResponse('An unexpected error occurred', { status: 500 });
    }
}
