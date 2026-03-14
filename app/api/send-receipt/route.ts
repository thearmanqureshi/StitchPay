import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { to, workerName, receiptHtml, cycleLabel } = await req.json();

    if (!to || !receiptHtml) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `StitchPay <${process.env.GMAIL_USER}>`,
      to,
      subject: `Your Wage Receipt · ${cycleLabel}`,
      html: receiptHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}