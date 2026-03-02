import { StreamChat } from "stream-chat";

const API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!;
const SECRET_KEY = process.env.STREAM_SECRET_KEY!;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const client = StreamChat.getInstance(API_KEY, SECRET_KEY);
    const token = client.createToken(userId);

    return Response.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Token generation error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
