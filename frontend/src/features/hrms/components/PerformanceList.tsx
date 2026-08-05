"use client";

import { useState } from "react";
import { Star, Plus, TrendingUp, Award, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PerformanceReview {
  id: string;
  employeeName: string;
  department: string;
  reviewerName: string;
  cycle: string; // e.g. Q2 2026
  rating: number; // out of 5
  status: "Draft" | "Self-Submitted" | "Manager-Reviewed" | "Completed";
}

const INITIAL_REVIEWS: PerformanceReview[] = [
  { id: "1", employeeName: "Rahul Verma", department: "Engineering", reviewerName: "Alex Rivera", cycle: "Q2 2026", rating: 4.5, status: "Completed" },
  { id: "2", employeeName: "Ananya Roy", department: "Finance", reviewerName: "Michael Chen", cycle: "Q2 2026", rating: 4.2, status: "Completed" },
  { id: "3", employeeName: "Vikram Singh", department: "Support", reviewerName: "Sarah Jenkins", cycle: "Q2 2026", rating: 3.8, status: "Manager-Reviewed" },
  { id: "4", employeeName: "Pooja Patel", department: "HR", reviewerName: "Sarah Jenkins", cycle: "Q2 2026", rating: 4.8, status: "Completed" },
];

export function PerformanceList() {
  const [reviews] = useState<PerformanceReview[]>(INITIAL_REVIEWS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance & Appraisal Reviews"
        subtitle="Manage quarterly evaluation cycles, 360 feedback, and rating scores"
        breadcrumbs={[
          { label: "HRMS", href: "/hrms" },
          { label: "Performance" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Initiate Review Cycle
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((rev) => (
          <Card key={rev.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{rev.employeeName}</CardTitle>
                  <CardDescription className="text-xs">{rev.department} • {rev.cycle}</CardDescription>
                </div>
                <Badge variant={rev.status === "Completed" ? "success" : "warning"}>
                  {rev.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Reviewer</span>
                <span className="font-medium text-foreground">{rev.reviewerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rating Score</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-foreground">{rev.rating} / 5.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
