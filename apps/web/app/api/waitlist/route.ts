import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Using Resend email service
    // Get your API key from https://resend.com and set it as an environment variable
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      // For demo purposes, we'll simulate success if no API key is set
      // In production, this should return an error
      return NextResponse.json(
        { success: true, message: "Form submitted (demo mode - no email configured)" },
        { status: 200 }
      );
    }

    // Use configurable sender email, default to Resend's test email
    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const recipientEmail = process.env.WAITLIST_EMAIL || "singhvikram90200@gmail.com";

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: recipientEmail,
        reply_to: email,
        subject: `New Waitlist Signup: ${name || "Anonymous"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">New Waitlist Signup</h2>
            <p><strong>Name:</strong> ${name || "Not provided"}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role || "Not specified"}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is an automated email from your Concrete Build waitlist form.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Successfully added to waitlist" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
