"use client";

import Link from "next/link";
import { ChildProfile } from "@/types/child";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil } from "lucide-react";

interface ChildProfileCardProps {
  child: ChildProfile;
}

function genderIcon(gender: ChildProfile["gender"]) {
  if (gender === "boy") return "👦";
  if (gender === "girl") return "👧";
  return "🧒";
}

function ageLabel(age: number) {
  if (age === -1) return "Pre-birth";
  if (age === 0) return "Newborn";
  return `${age} year${age === 1 ? "" : "s"} old`;
}

export default function ChildProfileCard({ child }: ChildProfileCardProps) {
  const initials = child.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group relative overflow-hidden border-violet-100/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-100/40 transition-all duration-300">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-violet-100 shrink-0">
            {child.photoUrl ? (
              <AvatarImage src={child.photoUrl} alt={child.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-violet-100 to-pink-100 text-violet-700 font-heading text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-gray-900 truncate">
                {child.name}
              </h3>
              <span className="text-base" aria-label={child.gender}>
                {genderIcon(child.gender)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{ageLabel(child.age)}</p>
          </div>

          <button
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-violet-50">
          <Link href={`/create?childId=${child.id}`}>
            <Button
              variant="outline"
              className="w-full rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 font-medium text-sm transition-colors"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Book
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
