import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  children?: ReactNode;
}

export function StatCard({ title, value, children }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {children && <div className="mt-2">{children}</div>}
      </CardContent>
    </Card>
  );
}
