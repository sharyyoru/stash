import { NextRequest, NextResponse } from "next/server";
import { getUserByResetToken, updatePassword, validatePassword } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Get user by reset token
    const user = await getUserByResetToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Update the password
    await updatePassword(user.email, password);

    return NextResponse.json({
      success: true,
      message: "Password set successfully. You can now sign in.",
    });
  } catch (error: any) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}

// GET endpoint to verify token is valid (for the set-password page)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const user = await getUserByResetToken(token);

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: "Invalid or expired reset link",
      });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
    });
  } catch (error: any) {
    console.error("[Verify Token] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
