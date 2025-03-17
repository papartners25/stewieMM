"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { loadPrediction } from "@/lib/actions"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type TeamStats = {
  teamId: string
  teamName: string
  seed: number
  region: string
  winProbability: number
  effectiveFgPct: number
  turnoverPct: number
  offensiveReboundPct: number
  defensiveEfficiency: number
}

export function PredictionStats() {
  const [stats, setStats] = useState<{
    teams: TeamStats[]
    upsetProbability: number
    regionStrength: { name: string; strength: number }[]
    seedAdvancement: { seed: number; count: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await loadPrediction();
        if (data && data.predictions) {
          // Process the data to extract statistics
          const processedStats = processStats(data.predictions);
          setStats(processedStats);
        }
        setLoading(false); // Set loading to false regardless of whether we have data
      } catch (err) {
        console.error("Failed to load stats:", err);
        setLoading(false);
      }
    };

    fetchStats();

    // Listen for prediction complete events
    const handlePredictionComplete = (event: CustomEvent<any>) => {
      console.log("PredictionStats received prediction event:", event.detail);
      if (event.detail && event.detail.predictions) {
        const processedStats = processStats(event.detail.predictions);
        setStats(processedStats);
        setLoading(false);
      }
    };

    window.addEventListener("predictionComplete", handlePredictionComplete as EventListener);

    return () => {
      window.removeEventListener("predictionComplete", handlePredictionComplete as EventListener);
    };
  }, []);

  const processStats = (predictions: any) => {
    // This is a simplified version - you'll need to adapt this to your actual data structure
    const teams: TeamStats[] = [];
    const regions: Record<string, number> = {};
    const seedAdvancement: Record<number, number> = {};
    let upsetCount = 0;
    let totalGames = 0;

    // Process each round
    for (let i = 1; i <= 6; i++) {
      if (predictions[i]) {
        predictions[i].forEach((game: any) => {
          totalGames++;
        
        // Check for upsets
        const team1Seed = game.matchup.team1_seed || 0;
        const team2Seed = game.matchup.team2_seed || 0;
        const winnerIsTeam1 = game.prediction.winner === game.matchup.team1;
        
        if ((winnerIsTeam1 && team1Seed > team2Seed) || 
            (!winnerIsTeam1 && team2Seed > team1Seed)) {
          upsetCount++;
        }
        
        // Track seed advancement
        const winnerSeed = winnerIsTeam1 ? team1Seed : team2Seed;
        seedAdvancement[winnerSeed] = (seedAdvancement[winnerSeed] || 0) + 1;
        
        // Track region strength
        const region = game.matchup.region;
        if (region) {
          regions[region] = (regions[region] || 0) + 1;
        }
        
        // Collect team stats for the final rounds
        if (i >= 4) { // Elite 8 and beyond
          // Extract team names
          const team1Name = game.matchup.team1_name || `Team ${game.matchup.team1}`;
          const team2Name = game.matchup.team2_name || `Team ${game.matchup.team2}`;
          
          // Extract region
          const team1Region = game.matchup.region || "Unknown";
          const team2Region = game.matchup.region || "Unknown";
          
          const team1 = {
            teamId: game.matchup.team1,
            teamName: team1Name,
            seed: team1Seed,
            region: team1Region,
            winProbability: winnerIsTeam1 ? game.prediction.win_probability : 1 - game.prediction.win_probability,
            effectiveFgPct: Math.random() * 0.2 + 0.4, // Placeholder
            turnoverPct: Math.random() * 0.1 + 0.1, // Placeholder
            offensiveReboundPct: Math.random() * 0.2 + 0.2, // Placeholder
            defensiveEfficiency: Math.random() * 20 + 90 // Placeholder
          };
          
          const team2 = {
            teamId: game.matchup.team2,
            teamName: team2Name,
            seed: team2Seed,
            region: team2Region,
            winProbability: !winnerIsTeam1 ? game.prediction.win_probability : 1 - game.prediction.win_probability,
            effectiveFgPct: Math.random() * 0.2 + 0.4, // Placeholder
            turnoverPct: Math.random() * 0.1 + 0.1, // Placeholder
            offensiveReboundPct: Math.random() * 0.2 + 0.2, // Placeholder
            defensiveEfficiency: Math.random() * 20 + 90 // Placeholder
          };
          
          teams.push(team1, team2);
        }
      });
    }

    // Format region strength data
    const regionStrength = Object.entries(regions).map(([name, strength]) => ({
      name,
      strength
    }));

    // Format seed advancement data
    const seedAdvancementArray = Object.entries(seedAdvancement).map(([seed, count]) => ({
      seed: Number.parseInt(seed),
      count
    })).sort((a, b) => a.seed - b.seed);

    return {
      teams: teams.filter((team, index, self) => 
        index === self.findIndex((t) => t.teamId === team.teamId)
      ),
      upsetProbability: upsetCount / totalGames,
      regionStrength,
      seedAdvancement: seedAdvancementArray
    };
  };

  if (loading) {
    return <StatsSkeleton />
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No statistics available.</p>
        <p className="mt-2">Run a prediction to generate statistics.</p>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <Tabs defaultValue="teams">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="teams">Top Teams</TabsTrigger>
        <TabsTrigger value="upsets">Upsets</TabsTrigger>
        <TabsTrigger value="regions">Regions</TabsTrigger>
        <TabsTrigger value="seeds">Seeds</TabsTrigger>
      </TabsList>

      <TabsContent value="teams" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Team Win Probability</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.teams.sort((a, b) => b.winProbability - a.winProbability).slice(0, 8)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teamName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="winProbability" name="Win Probability" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Effective Field Goal %</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.teams.sort((a, b) => b.effectiveFgPct - a.effectiveFgPct).slice(0, 8)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teamName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="effectiveFgPct" name="Effective FG%" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="upsets" className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Upset Probability</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Upsets", value: stats.upsetProbability },
                      { name: "Favorites", value: 1 - stats.upsetProbability },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: "Upsets", value: stats.upsetProbability },
                      { name: "Favorites", value: 1 - stats.upsetProbability },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="regions" className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Region Strength</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.regionStrength} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="strength" name="Strength Score" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seeds" className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Seed Advancement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.seedAdvancement} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="seed" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Number of Advancements" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
}

