import { NextRequest, NextResponse } from "next/server";
import { setResetToken, sendPasswordResetEmail, getUserByEmail } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if user exists and if they have a password set
    const user = await getUserByEmail(email);
    const isNewUser = user && !user.password_hash;

    // Generate reset token (returns null if user doesn't exist)
    const token = await setResetToken(email);

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (token) {
      await sendPasswordResetEmail(email, token, isNewUser);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error: any) {
    console.error("[Forgot Password] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
