import connectToDatabase from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Grievance from "@/models/grievance";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authoptions";
import mongoose from "mongoose";
import { sendNotificationToUser } from "@/app/actions";

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
          $match: {
            by: mongoose.Types.ObjectId.createFromHexString(session.user.id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "against",
            foreignField: "_id",
            as: "againstName",
          },
        },
        {
          $unwind: "$againstName",
        },
        {
          $project: {
            _id: 1,
            by: 1,
            against: 1,
            text: 1,
            image: 1,
            againstName: {
              name: 1,
            },
          },
        },
      ]).exec(),
      Grievance.aggregate([
        {
          $match: {
            against: mongoose.Types.ObjectId.createFromHexString(
              session.user.id,
            ),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "by",
            foreignField: "_id",
            as: "byName",
          },
        },
        {
          $unwind: "$byName",
        },
        {
          $project: {
            _id: 1,
            by: 1,
            against: 1,
            text: 1,
            image: 1,
            byName: {
              name: 1,
            },
          },
        },
      ]).exec(),
    ]);
    const result = {
      byYou: byYou.map((g) => {
        return {
          ...g,
          against: {
            _id: g.against,
            name: g.againstName.name,
          },
        };
      }),
      againstYou: againstYou.map((g) => {
        return {
          ...g,
          by: {
            _id: g.by,
            name: g.byName.name,
          },
        };
      }),
    };
    // console.dir(result);
    return NextResponse.json(result);
  } catch {
    // console.error("Error fetching grievances:", error);
    return NextResponse.error();
  }
}

export async function POST(request: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.against) {
      return NextResponse.json(
        { message: "Select someone to post a grievance against." },
        { status: 400 },
      );
    }
    const grievance = new Grievance({
      ...body,
      by: session.user.id,
    });
    const g = await grievance.save();
    sendNotificationToUser(
      g.against,
      `${session.user.name} posted a grievance against you!`,
    );
    return NextResponse.json({ _id: g._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating grievance:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
