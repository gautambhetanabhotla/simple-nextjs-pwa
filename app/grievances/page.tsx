"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Grievance {
  _id: string;
  by:
    | {
        _id: string;
        name: string;
      }
    | string;
  against:
    | {
        _id: string;
        name: string;
      }
    | string;
  text: string;
  image?: Buffer | null;
  createdAt: Date;
  updatedAt: Date;
}

function GrievancesByYou({ grievances }: { grievances?: Grievance[] }) {
  return (
    <div className="space-y-2">
      {grievances?.map((grievance) => (
        <Card key={grievance._id}>
          <CardHeader>
            <CardTitle>
              Against&nbsp;
              {typeof grievance.against === "object"
                ? grievance.against.name
                : grievance.against}
              :
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{grievance.text}</CardDescription>
          </CardContent>
          {grievance.createdAt && (
            <CardFooter>
              <div className="w-full flex justify-between gap-8 items-center">
                <p className="text-gray-600 text-xs">
                  Posted {new Date(grievance.createdAt).toLocaleString()}
                </p>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}

function GrievancesAgainstYou({ grievances }: { grievances?: Grievance[] }) {
  return (
    <div className="space-y-2">
      <p className="pl-1">
        {grievances?.length === 0
          ? "No grievances against you!"
          : "Reply feature coming soon!"}
      </p>
      {grievances?.map((grievance) => (
        <Card key={grievance._id}>
          <CardHeader>
            <CardTitle>
              {typeof grievance.by === "object"
                ? grievance.by.name
                : grievance.by}
              &nbsp;says:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{grievance.text}</CardDescription>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between gap-8 items-center">
              {grievance.createdAt && (
                <p className="text-gray-600 text-xs">
                  Posted {new Date(grievance.createdAt).toLocaleString()}
                </p>
              )}
              <CardAction>
                <Button disabled size="sm">
                  <Reply className="mr-1" />
                  <p className="mt-0.5">Reply</p>
                </Button>
              </CardAction>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<{
    byYou: Grievance[];
    againstYou: Grievance[];
  }>({ byYou: [], againstYou: [] });
  useEffect(() => {
    const fetchGrievances = async () => {
      const response = await fetch("/api/grievances");
      const data = await response.json();
      setGrievances(data);
      console.dir(data);
    };
    fetchGrievances();
  }, []);
  return (
    <div className="pt-20">
      <Tabs defaultValue="byYou" className="flex items-center justify-center">
        <TabsList>
          <TabsTrigger value="byYou">By you</TabsTrigger>
          <TabsTrigger value="againstYou">Against you</TabsTrigger>
        </TabsList>
        <TabsContent value="byYou">
          <GrievancesByYou grievances={grievances.byYou} />
        </TabsContent>
        <TabsContent value="againstYou">
          <GrievancesAgainstYou grievances={grievances.againstYou} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
