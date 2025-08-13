import connectToDatabase from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Grievance from "@/models/grievance";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authoptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  try {
    const [byYou, againstYou] = await Promise.all([
      Grievance.aggregate([
        {
          $match: { by: session.user.id },
          $lookup: {
            from: "users",
            localField: "against",
            foreignField: "_id",
            as: "againstName",
          },
        },
      ]),
      Grievance.aggregate([
        {
          $match: { against: session.user.id },
          $lookup: {
            from: "users",
            localField: "by",
            foreignField: "_id",
            as: "byName",
          },
        },
      ]),
    ]);
    return NextResponse.json({
      byYou: byYou.map((g) => {
        return {
          ...g,
          against: {
            id: g.against,
            name: g.againstName,
          },
        };
      }),
      againstYou: againstYou.map((g) => {
        return {
          ...g,
          by: {
            id: g.by,
            name: g.byName,
          },
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching grievances:", error);
    return NextResponse.error();
  }
}

export async function POST(request: Request) {
  await connectToDatabase();
  try {
    const body = await request.json();
    const grievance = new Grievance(body);
    await grievance.save();
    return NextResponse.json({}, { status: 201 });
  } catch (error) {
    console.error("Error creating grievance:", error);
    return NextResponse.error();
  }
}
