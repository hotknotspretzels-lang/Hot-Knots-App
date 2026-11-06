import { createClient } from "@/lib/supabase/server";
import { bucketSales, type SalesGranularity } from "@/lib/sales-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarStat } from "@/components/charts";
import { SalesFilters } from "./sales-filters";

const AVG_LABELS: Record<SalesGranularity, string> = {
  hourly: "Avg per hour",
  daily: "Avg per day",
  weekly: "Avg per week",
  monthly: "Avg per month",
};

function rangeStartDate(range: string): string | null {
  const now = new Date();
  if (range === "30d") now.setDate(now.getDate() - 30);
  else if (range === "90d") now.setDate(now.getDate() - 90);
  else if (range === "ytd") now.setMonth(0, 1);
  else return null;
  return now.toISOString();
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string; range?: string; day?: string }>;
}) {
  const {
    granularity: granularityParam = "daily",
    range = "30d",
    day = new Date().toISOString().slice(0, 10),
  } = await searchParams;

  const granularity = granularityParam as SalesGranularity;
  const supabase = await createClient();

  let query = supabase.from("sales_transactions").select("transaction_time, total");

  if (granularity === "hourly") {
    const dayStart = new Date(`${day}T00:00:00`);
    const windowStart = new Date(dayStart);
    windowStart.setDate(windowStart.getDate() - 1);
    const windowEnd = new Date(dayStart);
    windowEnd.setDate(windowEnd.getDate() + 2);
    query = query
      .gte("transaction_time", windowStart.toISOString())
      .lt("transaction_time", windowEnd.toISOString());
  } else {
    const since = rangeStartDate(range);
    if (since) query = query.gte("transaction_time", since);
  }

  const { data: transactions } = await query;
  const buckets = bucketSales(transactions ?? [], granularity, day);

  const totalValue = buckets.reduce((sum, b) => sum + b.value, 0);
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
  const nonEmptyBuckets = buckets.filter((b) => b.count > 0);
  const avgPerBucket = nonEmptyBuckets.length
    ? totalValue / nonEmptyBuckets.length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-sm text-muted-foreground">
            Sales over time — drill into a single day by the hour, or zoom out
            by day, week, or month.
          </p>
        </div>
        <SalesFilters />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total net sales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${totalValue.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {AVG_LABELS[granularity]}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${avgPerBucket.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      {buckets.every((b) => b.count === 0) ? (
        <p className="text-muted-foreground">No sales in this period yet.</p>
      ) : (
        <BarStat title="Net sales" data={buckets} format="currency" />
      )}
    </div>
  );
}
