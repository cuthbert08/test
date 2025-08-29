import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-access-token');
    const response = await axios.get('https://bin-reminder-app.vercel.app/api/dashboard', {
        headers: {
            'x-access-token': token || ''
        }
    });
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error fetching dashboard data:', error.response?.data);
        return new NextResponse(error.response?.data || 'Error fetching dashboard data', {
            status: error.response?.status || 500,
        });
    }
    console.error('An unexpected error occurred:', error);
    return new NextResponse('An unexpected error occurred', { status: 500 });
  }
}
