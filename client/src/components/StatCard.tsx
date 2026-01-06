import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "success";
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  trendValue,
  className,
  isLoading = false,
  variant = "default"
}: StatCardProps) {
  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-300", 
      variant === "destructive" && "border-destructive/50",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-none">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
        )}>
          <Icon 
            className={cn(
              "h-4 w-4", 
              variant === "destructive" ? "text-destructive" : "text-primary"
            )} 
            aria-hidden="true" 
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold font-display tracking-tight">
              {value ?? "—"}
            </div>
            {(description || trendValue) && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                {trend && trendValue && (
                  <span className={cn(
                    "font-bold flex items-center",
                    trend === "up" ? "text-emerald-500" : 
                    trend === "down" ? "text-rose-500" : "text-amber-500"
                  )}>
                    {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} 
                    <span className="ml-0.5">{trendValue}</span>
                  </span>
                )}
                <span className="opacity-80">{description}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}