import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user";
import connectToDatabase from "@/lib/mongodb";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  try {
    const body = await request.json();
    console.dir(body);
    const hashedPassword = await hash(
      body.password,
      parseInt(process.env.HASH_SALT_ROUNDS!),
    );
    const u = await User.create({ ...body, passwordHash: hashedPassword });
    return NextResponse.json(
      {
        _id: u._id,
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    console.log((e as Error).name);
    if ((e as Error).name === "ValidationError") {
      return NextResponse.json(
        {
          message: (e as Error).message,
        },
        {
          status: 400, // Bad Request
        },
      );
    } else if ((e as Error).name === "MongoServerError") {
      console.dir(e);
      return NextResponse.json(
        {
          message: "Email already exists",
        },
        {
          status: 409, // Conflict
        },
      );
    }
    return NextResponse.json(
      {
        message: (e as Error).message || "Something went wrong",
      },
      {
        status: 500, // Internal Server Error
      },
    );
  }
}
