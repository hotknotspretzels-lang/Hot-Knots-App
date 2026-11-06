import { createClient } from "@/lib/supabase/server";
import type {
  Event,
  SocialMetric,
  SocialPost,
  SocialStrategyPlan,
} from "@/lib/types";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_POST_TYPE_LABELS } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarStat } from "@/components/charts";
import { StrategyDialog } from "./strategy-dialog";
import { MarkPostedDialog } from "./mark-posted-dialog";
import { PostDialog } from "./post-dialog";
import { LogMetricsDialog } from "./log-metrics-dialog";
import { StatusSelect } from "./status-select";
import { deleteStrategyItem, deletePost } from "./actions";

export default async function SocialPage() {
  const supabase = await createClient();

  const [
    { data: events },
    { data: strategyItems },
    { data: posts },
    { data: metrics },
  ] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: false }),
    supabase
      .from("social_strategy_plan")
      .select("*")
      .order("planned_date", { ascending: true }),
    supabase.from("social_posts").select("*").order("post_date", { ascending: false }),
    supabase.from("social_metrics").select("*"),
  ]);

  const eventList = (events ?? []) as Event[];
  const strategyList = (strategyItems ?? []) as SocialStrategyPlan[];
  const postList = (posts ?? []) as SocialPost[];
  const metricList = (metrics ?? []) as SocialMetric[];

  const eventNameById = new Map(eventList.map((e) => [e.id, e.name]));

  const latestMetricByPost = new Map<string, SocialMetric>();
  for (const m of metricList) {
    const existing = latestMetricByPost.get(m.post_id);
    if (!existing || m.recorded_date >= existing.recorded_date) {
      latestMetricByPost.set(m.post_id, m);
    }
  }

  const engagementByPlatform = new Map<string, number>();
  for (const p of postList) {
    const latest = latestMetricByPost.get(p.id);
    if (!latest) continue;
    const total =
      (latest.likes ?? 0) + (latest.comments ?? 0) + (latest.shares ?? 0) + (latest.saves ?? 0);
    const label = SOCIAL_PLATFORM_LABELS[p.platform];
    engagementByPlatform.set(label, (engagementByPlatform.get(label) ?? 0) + total);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Social</h1>
        <p className="text-sm text-muted-foreground">
          Plan a posting schedule and track engagement on what actually goes out.
        </p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="posts">Posts & Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <StrategyDialog events={eventList} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Content idea</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategyList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No content planned yet. Add your first idea to start building a
                    schedule.
                  </TableCell>
                </TableRow>
              ) : (
                strategyList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.planned_date + "T00:00:00").toLocaleDateString()}
                    </TableCell>
                    <TableCell>{SOCIAL_PLATFORM_LABELS[item.platform]}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.content_idea}
                    </TableCell>
                    <TableCell>
                      {item.linked_event_id
                        ? eventNameById.get(item.linked_event_id) ?? "—"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusSelect
                        key={item.status}
                        id={item.id}
                        status={item.status}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.status !== "posted" ? (
                          <MarkPostedDialog
                            strategyId={item.id}
                            contentIdea={item.content_idea}
                          />
                        ) : null}
                        <form action={deleteStrategyItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button variant="ghost" size="sm" type="submit">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="posts" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <PostDialog events={eventList} />
          </div>

          {engagementByPlatform.size > 0 ? (
            <BarStat
              title="Engagement by platform"
              data={Array.from(engagementByPlatform.entries()).map(([label, value]) => ({
                label,
                value,
              }))}
              format="number"
              tooltipLabel="Engagement"
            />
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Latest engagement</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {postList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No posts logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                postList.map((post) => {
                  const latest = latestMetricByPost.get(post.id);
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        {new Date(post.post_date + "T00:00:00").toLocaleDateString()}
                      </TableCell>
                      <TableCell>{SOCIAL_PLATFORM_LABELS[post.platform]}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {SOCIAL_POST_TYPE_LABELS[post.post_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {post.permalink ? (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {post.caption_summary || post.permalink}
                          </a>
                        ) : (
                          (post.caption_summary ?? "—")
                        )}
                      </TableCell>
                      <TableCell>
                        {post.linked_event_id
                          ? eventNameById.get(post.linked_event_id) ?? "—"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {latest
                          ? `${latest.likes ?? 0} likes · ${latest.comments ?? 0} comments · ${latest.views ?? 0} views`
                          : "No data yet"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <LogMetricsDialog postId={post.id} />
                          <form action={deletePost}>
                            <input type="hidden" name="id" value={post.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
