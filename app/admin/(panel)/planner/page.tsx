import type { Metadata } from "next";
import Planner from "@/components/planner/Planner";

export const metadata: Metadata = { title: "Cost planner" };

export default function AdminPlannerPage() {
  return <Planner />;
}
