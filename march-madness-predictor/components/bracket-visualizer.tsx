"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { loadPrediction } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InfoIcon } from "lucide-react"

type Team = {
  id: string
  name: string
  seed: number
  region?: string
}

type Matchup = {
  team1: Team
  team2: Team
  winner: string
  winProbability: number
  pointDifference: number
  reasoning?: any
}

type Round = {
  name: string
  dates: string
  matchups: Matchup[]
}

type Region = {
  name: string
  rounds: Round[]
}

type Bracket = {
  leftRegions: Region[]
  rightRegions: Region[]
  finalFour: Round
  championship: Round
}

export function BracketVisualizer() {
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null)

  useEffect(() => {
    const fetchBracket = async () => {
      try {
        const data = await loadPrediction()
        if (data && data.predictions) {
          const formattedBracket = formatBracketData(data.predictions)
          setBracket(formattedBracket)
        }
        setLoading(false) // Set loading to false regardless of whether we have data
      } catch (err) {
        console.error("Failed to load bracket:", err)
        setError("Failed to load bracket data")
        setLoading(false)
      }
    }

    fetchBracket()

    // Listen for prediction complete events
    const handlePredictionComplete = (event: CustomEvent) => {
      if (event.detail && event.detail.predictions) {
        console.log("BracketVisualizer received prediction event:", event.detail)
        const formattedBracket = formatBracketData(event.detail.predictions)
        setBracket(formattedBracket)
        setLoading(false)
        setError(null)
      }
    }

    window.addEventListener("predictionComplete", handlePredictionComplete as EventListener)

    return () => {
      window.removeEventListener("predictionComplete", handlePredictionComplete as EventListener)
    }
  }, [])

  const formatBracketData = (predictions: any): Bracket => {
    // Define round names and dates
    const roundInfo = {
      1: { name: "FIRST ROUND", dates: "3/20-3/21" },
      2: { name: "SECOND ROUND", dates: "3/22-3/23" },
      3: { name: "SWEET 16", dates: "3/27-3/28" },
      4: { name: "ELITE EIGHT", dates: "3/29-3/30" },
      5: { name: "FINAL FOUR", dates: "4/5" },
      6: { name: "CHAMPIONSHIP", dates: "4/7" },
    }

    // Group matchups by region
    const regionMatchups: Record<string, Record<number, Matchup[]>> = {}
    const finalFourMatchups: Matchup[] = []
    const championshipMatchups: Matchup[] = []

    // Process each round
    for (let i = 1; i <= 6; i++) {
      if (predictions[i]) {
        predictions[i].forEach((game: any) => {
          // Extract team info
          const team1Id = game.matchup.team1
          const team2Id = game.matchup.team2
          const team1Name = game.matchup.team1_name || `Team ${team1Id}`
          const team2Name = game.matchup.team2_name || `Team ${team2Id}`
          const team1Seed = game.matchup.team1_seed || 0
          const team2Seed = game.matchup.team2_seed || 0
          const region = game.matchup.region

          const matchup: Matchup = {
            team1: {
              id: team1Id,
              name: team1Name,
              seed: team1Seed,
              region: region,
            },
            team2: {
              id: team2Id,
              name: team2Name,
              seed: team2Seed,
              region: region,
            },
            winner: game.prediction.winner,
            winProbability: game.prediction.win_probability,
            pointDifference: game.prediction.point_difference,
            reasoning: game.prediction.reasoning,
          }

          // Add to appropriate collection based on round
          if (i <= 4) {
            // Rounds 1-4 are grouped by region
            if (!regionMatchups[region]) {
              regionMatchups[region] = {}
            }
            if (!regionMatchups[region][i]) {
              regionMatchups[region][i] = []
            }
            regionMatchups[region][i].push(matchup)
          } else if (i === 5) {
            // Final Four
            finalFourMatchups.push(matchup)
          } else {
            // Championship
            championshipMatchups.push(matchup)
          }
        })
      }
    }

    // Create regions array
    const regions: Region[] = Object.entries(regionMatchups).map(([regionName, rounds]) => {
      const regionRounds: Round[] = []

      // Add rounds 1-4 for this region
      for (let i = 1; i <= 4; i++) {
        regionRounds.push({
          name: roundInfo[i as keyof typeof roundInfo].name,
          dates: roundInfo[i as keyof typeof roundInfo].dates,
          matchups: rounds[i] || [],
        })
      }

      return {
        name: regionName,
        rounds: regionRounds,
      }
    })

    // Split regions into left and right sides
    const leftRegions = regions.slice(0, Math.ceil(regions.length / 2))
    const rightRegions = regions.slice(Math.ceil(regions.length / 2)).reverse()

    return {
      leftRegions,
      rightRegions,
      finalFour: {
        name: roundInfo[5].name,
        dates: roundInfo[5].dates,
        matchups: finalFourMatchups,
      },
      championship: {
        name: roundInfo[6].name,
        dates: roundInfo[6].dates,
        matchups: championshipMatchups,
      },
    }
  }

  if (loading) {
    return <BracketSkeleton />
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <p className="mt-2">Run a prediction to generate a bracket.</p>
      </div>
    )
  }

  if (!bracket) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No bracket data available.</p>
        <p className="mt-2">Run a prediction to generate a bracket.</p>
      </div>
    )
  }

  return (
    <div className="bracket-container overflow-x-auto">
      <div className="flex min-w-[1500px] gap-1 pb-6">
        {/* Left side regions */}
        <div className="flex flex-col flex-1">
          {bracket.leftRegions.map((region, regionIndex) => (
            <div key={`left-${regionIndex}`} className="mb-4">
              <h3 className="text-center font-bold text-primary mb-2">{region.name}</h3>
              <div className="flex">
                {region.rounds.map((round, roundIndex) => (
                  <div key={`left-${regionIndex}-${roundIndex}`} className="flex flex-col flex-1">
                    <div className="text-center text-xs font-semibold mb-1">
                      <div>{round.name}</div>
                      <div className="text-muted-foreground">{round.dates}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {round.matchups.map((matchup, matchupIndex) => (
                        <MatchupCard
                          key={`left-${regionIndex}-${roundIndex}-${matchupIndex}`}
                          matchup={matchup}
                          roundIndex={roundIndex}
                          align="left"
                          onShowDetails={() => setSelectedMatchup(matchup)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center (Final Four and Championship) */}
        <div className="flex flex-col items-center justify-center mx-2 min-w-[200px]">
          {/* Final Four */}
          <div className="mb-4 w-full">
            <div className="text-center text-xs font-semibold mb-1">
              <div>{bracket.finalFour.name}</div>
              <div className="text-muted-foreground">{bracket.finalFour.dates}</div>
            </div>
            <div className="flex flex-col gap-4">
              {bracket.finalFour.matchups.map((matchup, matchupIndex) => (
                <MatchupCard
                  key={`finalfour-${matchupIndex}`}
                  matchup={matchup}
                  roundIndex={4}
                  align="center"
                  onShowDetails={() => setSelectedMatchup(matchup)}
                />
              ))}
            </div>
          </div>

          {/* Championship */}
          <div className="w-full">
            <div className="text-center text-xs font-semibold mb-1">
              <div>{bracket.championship.name}</div>
              <div className="text-muted-foreground">{bracket.championship.dates}</div>
            </div>
            <div className="flex flex-col gap-2">
              {bracket.championship.matchups.map((matchup, matchupIndex) => (
                <MatchupCard
                  key={`championship-${matchupIndex}`}
                  matchup={matchup}
                  roundIndex={5}
                  align="center"
                  isChampionship={true}
                  onShowDetails={() => setSelectedMatchup(matchup)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side regions */}
        <div className="flex flex-col flex-1">
          {bracket.rightRegions.map((region, regionIndex) => (
            <div key={`right-${regionIndex}`} className="mb-4">
              <h3 className="text-center font-bold text-primary mb-2">{region.name}</h3>
              <div className="flex">
                {[...region.rounds].reverse().map((round, roundIndex) => (
                  <div key={`right-${regionIndex}-${roundIndex}`} className="flex flex-col flex-1">
                    <div className="text-center text-xs font-semibold mb-1">
                      <div>{round.name}</div>
                      <div className="text-muted-foreground">{round.dates}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {round.matchups.map((matchup, matchupIndex) => (
                        <MatchupCard
                          key={`right-${regionIndex}-${roundIndex}-${matchupIndex}`}
                          matchup={matchup}
                          roundIndex={roundIndex}
                          align="right"
                          onShowDetails={() => setSelectedMatchup(matchup)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matchup Details Dialog */}
      {selectedMatchup && (
        <MatchupDetailsDialog
          matchup={selectedMatchup}
          open={!!selectedMatchup}
          onOpenChange={() => setSelectedMatchup(null)}
        />
      )}
    </div>
  )
}

function MatchupCard({
  matchup,
  roundIndex,
  align = "left",
  isChampionship = false,
  onShowDetails,
}: {
  matchup: Matchup
  roundIndex: number
  align?: "left" | "right" | "center"
  isChampionship?: boolean
  onShowDetails: () => void
}) {
  const isTeam1Winner = matchup.winner === matchup.team1.id
  const winnerStyle = "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
  const normalStyle = "bg-card"

  // Adjust spacing based on round
  const getSpacing = () => {
    if (roundIndex === 0) return "my-0.5"
    if (roundIndex === 1) return "my-3"
    if (roundIndex === 2) return "my-8"
    if (roundIndex === 3) return "my-20"
    return "my-4"
  }

  // Championship gets special styling
  const cardClass = isChampionship ? "border-2 border-primary" : "border"

  return (
    <div className={`relative ${getSpacing()}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={`w-full ${cardClass} group`}>
              <CardContent className="p-2">
                {align === "right" ? (
                  // Right side layout
                  <>
                    <div
                      className={`flex items-center justify-between p-1 rounded-md ${!isTeam1Winner ? winnerStyle : normalStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {matchup.team2.seed}
                        </Badge>
                        <span className="font-medium text-sm">{matchup.team2.name}</span>
                      </div>
                    </div>

                    <div className="my-0.5 text-xs text-center text-muted-foreground">vs</div>

                    <div
                      className={`flex items-center justify-between p-1 rounded-md ${isTeam1Winner ? winnerStyle : normalStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {matchup.team1.seed}
                        </Badge>
                        <span className="font-medium text-sm">{matchup.team1.name}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Left and center layout
                  <>
                    <div
                      className={`flex items-center justify-between p-1 rounded-md ${isTeam1Winner ? winnerStyle : normalStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {matchup.team1.seed}
                        </Badge>
                        <span className="font-medium text-sm">{matchup.team1.name}</span>
                      </div>
                    </div>

                    <div className="my-0.5 text-xs text-center text-muted-foreground">vs</div>

                    <div
                      className={`flex items-center justify-between p-1 rounded-md ${!isTeam1Winner ? winnerStyle : normalStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {matchup.team2.seed}
                        </Badge>
                        <span className="font-medium text-sm">{matchup.team2.name}</span>
                      </div>
                    </div>
                  </>
                )}

                {isChampionship && (
                  <div className="mt-2 text-center">
                    <Badge variant="secondary" className="font-bold">
                      CHAMPION: {isTeam1Winner ? matchup.team1.name : matchup.team2.name}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-2">
              <p className="font-semibold">Prediction Details:</p>
              <p>Winner: {isTeam1Winner ? matchup.team1.name : matchup.team2.name}</p>
              <p>Win Probability: {(matchup.winProbability * 100).toFixed(1)}%</p>
              <p>Point Difference: {matchup.pointDifference.toFixed(1)}</p>
              <p className="text-xs mt-1 text-blue-500">Click for detailed analysis</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Info button for detailed analysis */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onShowDetails}
      >
        <InfoIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MatchupDetailsDialog({
  matchup,
  open,
  onOpenChange,
}: {
  matchup: Matchup
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isTeam1Winner = matchup.winner === matchup.team1.id
  const winnerTeam = isTeam1Winner ? matchup.team1 : matchup.team2
  const loserTeam = isTeam1Winner ? matchup.team2 : matchup.team1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {matchup.team1.seed} {matchup.team1.name} vs {matchup.team2.seed} {matchup.team2.name}
          </DialogTitle>
          <DialogDescription>Detailed prediction analysis</DialogDescription>
        </DialogHeader>

        {matchup.reasoning ? (
          <div className="space-y-4">
            {/* Prediction Summary */}
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-bold text-lg mb-2">Prediction Summary</h3>
              <p>{matchup.reasoning.summary}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                  Winner: {winnerTeam.seed} {winnerTeam.name}
                </Badge>
                <Badge variant="outline">Win Probability: {(matchup.winProbability * 100).toFixed(1)}%</Badge>
                <Badge variant="outline">Projected Point Difference: {matchup.pointDifference.toFixed(1)}</Badge>
              </div>
            </div>

            {/* Key Factors */}
            <div>
              <h3 className="font-bold text-lg mb-2">Key Factors</h3>
              <ul className="list-disc pl-5 space-y-1">
                {matchup.reasoning.keyFactors.map((factor: string, index: number) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>

            {/* Team Comparison */}
            <div>
              <h3 className="font-bold text-lg mb-2">Team Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team 1 */}
                <div
                  className={`p-4 rounded-md ${isTeam1Winner ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-muted"}`}
                >
                  <h4 className="font-semibold text-md flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {matchup.team1.seed}
                    </Badge>
                    {matchup.team1.name}
                    {isTeam1Winner && (
                      <Badge variant="secondary" className="ml-auto">
                        Winner
                      </Badge>
                    )}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Offensive Efficiency: {matchup.reasoning.teamComparison.team1.stats.offensiveEfficiency}</p>
                    <p>Defensive Efficiency: {matchup.reasoning.teamComparison.team1.stats.defensiveEfficiency}</p>
                    <p>Rebounding Rate: {matchup.reasoning.teamComparison.team1.stats.reboundingRate}%</p>
                    <p>Turnover Rate: {matchup.reasoning.teamComparison.team1.stats.turnoverRate}%</p>
                    <p>3-Point Shooting: {matchup.reasoning.teamComparison.team1.stats.threePointPct}%</p>
                    <p>Strength of Schedule: {matchup.reasoning.teamComparison.team1.stats.strengthOfSchedule}</p>
                    <p>Recent Form: {matchup.reasoning.teamComparison.team1.stats.recentForm}</p>
                    <p>Key Player Status: {matchup.reasoning.teamComparison.team1.stats.keyPlayerStatus}</p>
                  </div>
                </div>

                {/* Team 2 */}
                <div
                  className={`p-4 rounded-md ${!isTeam1Winner ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-muted"}`}
                >
                  <h4 className="font-semibold text-md flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {matchup.team2.seed}
                    </Badge>
                    {matchup.team2.name}
                    {!isTeam1Winner && (
                      <Badge variant="secondary" className="ml-auto">
                        Winner
                      </Badge>
                    )}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Offensive Efficiency: {matchup.reasoning.teamComparison.team2.stats.offensiveEfficiency}</p>
                    <p>Defensive Efficiency: {matchup.reasoning.teamComparison.team2.stats.defensiveEfficiency}</p>
                    <p>Rebounding Rate: {matchup.reasoning.teamComparison.team2.stats.reboundingRate}%</p>
                    <p>Turnover Rate: {matchup.reasoning.teamComparison.team2.stats.turnoverRate}%</p>
                    <p>3-Point Shooting: {matchup.reasoning.teamComparison.team2.stats.threePointPct}%</p>
                    <p>Strength of Schedule: {matchup.reasoning.teamComparison.team2.stats.strengthOfSchedule}</p>
                    <p>Recent Form: {matchup.reasoning.teamComparison.team2.stats.recentForm}</p>
                    <p>Key Player Status: {matchup.reasoning.teamComparison.team2.stats.keyPlayerStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p>Detailed reasoning not available for this matchup.</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BracketSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto min-w-[1200px] pb-6">
      {/* Left side */}
      <div className="flex-1">
        <Skeleton className="h-6 w-full mb-2" />
        <div className="flex">
          {[...Array(4)].map((_, roundIndex) => (
            <div key={`left-skeleton-${roundIndex}`} className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex flex-col gap-2">
                {[...Array(Math.max(1, 8 / Math.pow(2, roundIndex)))].map((_, matchupIndex) => (
                  <Skeleton key={`left-match-${roundIndex}-${matchupIndex}`} className="h-16 w-full my-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center */}
      <div className="mx-2 min-w-[200px]">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Right side */}
      <div className="flex-1">
        <Skeleton className="h-6 w-full mb-2" />
        <div className="flex">
          {[...Array(4)].map((_, roundIndex) => (
            <div key={`right-skeleton-${roundIndex}`} className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex flex-col gap-2">
                {[...Array(Math.max(1, 8 / Math.pow(2, roundIndex)))].map((_, matchupIndex) => (
                  <Skeleton key={`right-match-${roundIndex}-${matchupIndex}`} className="h-16 w-full my-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

