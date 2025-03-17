"use server"

import { promises as fs } from "fs"
import path from "path"

// Path to the prediction results file (in public directory for persistence)
const PREDICTION_FILE = path.join(process.cwd(), "public", "prediction_results.json")
const LOGS_FILE = path.join(process.cwd(), "public", "prediction_logs.json")

/**
 * Run the March Madness prediction script
 * This is a simulated version since we can't directly execute Python in this environment
 */
export async function runPrediction() {
  try {
    console.log("Generating prediction data...")

    // Generate mock prediction data
    const predictions = generateMockPredictions()
    const logs = generateMockLogs()

    // Ensure the public directory exists
    try {
      await fs.mkdir(path.join(process.cwd(), "public"), { recursive: true })
    } catch (error) {
      console.error("Error creating directory:", error)
    }

    // Save the prediction results
    try {
      await fs.writeFile(PREDICTION_FILE, JSON.stringify(predictions, null, 2))
      await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error("Error writing prediction files:", error)
    }

    return { predictions, logs }
  } catch (error) {
    console.error("Error running prediction:", error)
    throw new Error(`Failed to run prediction: ${error}`)
  }
}

/**
 * Save the current prediction to a file
 */
export async function savePrediction() {
  try {
    // Check if prediction file exists
    try {
      await fs.access(PREDICTION_FILE)
    } catch (error) {
      throw new Error("No prediction results found. Run a prediction first.")
    }

    // Read the prediction results
    const predictionsData = await fs.readFile(PREDICTION_FILE, "utf8")
    const predictions = JSON.parse(predictionsData)

    // Create a timestamped filename
    const timestamp = new Date().toISOString().replace(/:/g, "-")
    const saveFilePath = path.join(process.cwd(), "public", `bracket_${timestamp}.json`)

    // Save the prediction to the new file
    await fs.writeFile(saveFilePath, JSON.stringify(predictions, null, 2))

    return { success: true, filename: `bracket_${timestamp}.json` }
  } catch (error) {
    console.error("Error saving prediction:", error)
    throw new Error(`Failed to save prediction: ${error}`)
  }
}

// Modify the loadPrediction function to not automatically generate a prediction
export async function loadPrediction() {
  try {
    // Check if prediction file exists
    try {
      await fs.access(PREDICTION_FILE)

      // Read the prediction results
      const predictionsData = await fs.readFile(PREDICTION_FILE, "utf8")
      const predictions = JSON.parse(predictionsData)

      // Read the logs if they exist
      let logs = null
      try {
        const logsData = await fs.readFile(LOGS_FILE, "utf8")
        logs = JSON.parse(logsData)
      } catch (error) {
        console.error("Error reading logs:", error)
      }

      return { predictions, logs }
    } catch (error) {
      // If no prediction exists, return null instead of generating one
      console.log("No prediction file exists yet")
      return { predictions: null, logs: null }
    }
  } catch (error) {
    console.error("Error loading prediction:", error)
    throw new Error(`Failed to load prediction: ${error}`)
  }
}

/**
 * Generate detailed reasoning for a matchup prediction
 */
function generateMatchupReasoning(team1: any, team2: any, isUpset: boolean) {
  // Team stats (randomly generated for mock data)
  const team1Stats = {
    offensiveEfficiency: Math.round((Math.random() * 20 + 100) * 10) / 10,
    defensiveEfficiency: Math.round((Math.random() * 20 + 85) * 10) / 10,
    reboundingRate: Math.round((Math.random() * 15 + 45) * 10) / 10,
    turnoverRate: Math.round((Math.random() * 10 + 10) * 10) / 10,
    threePointPct: Math.round((Math.random() * 15 + 30) * 10) / 10,
    strengthOfSchedule: Math.round((Math.random() * 10 + 1) * 10) / 10,
    recentForm: Math.random() > 0.5 ? "Strong" : "Average",
    keyPlayerStatus: Math.random() > 0.8 ? "Injured" : "Healthy",
  }

  const team2Stats = {
    offensiveEfficiency: Math.round((Math.random() * 20 + 100) * 10) / 10,
    defensiveEfficiency: Math.round((Math.random() * 20 + 85) * 10) / 10,
    reboundingRate: Math.round((Math.random() * 15 + 45) * 10) / 10,
    turnoverRate: Math.round((Math.random() * 10 + 10) * 10) / 10,
    threePointPct: Math.round((Math.random() * 15 + 30) * 10) / 10,
    strengthOfSchedule: Math.round((Math.random() * 10 + 1) * 10) / 10,
    recentForm: Math.random() > 0.5 ? "Strong" : "Average",
    keyPlayerStatus: Math.random() > 0.8 ? "Injured" : "Healthy",
  }

  // Adjust stats to favor the predicted winner
  const team1Seed = team1.seed
  const team2Seed = team2.seed
  const seedDifference = Math.abs(team1Seed - team2Seed)

  // Generate key factors that influenced the prediction
  const keyFactors = []

  // For upsets, generate reasoning that explains why the underdog won
  if (isUpset) {
    // If team1 is the underdog and wins
    if (team1Seed > team2Seed) {
      team1Stats.offensiveEfficiency += 5
      team1Stats.threePointPct += 5
      team1Stats.recentForm = "Strong"

      if (team2Stats.keyPlayerStatus === "Healthy") {
        team2Stats.keyPlayerStatus = "Injured"
      }

      keyFactors.push(
        `${team1.name}'s offensive efficiency (${team1Stats.offensiveEfficiency}) exceeds expectations for a ${team1Seed} seed`,
      )
      keyFactors.push(
        `${team1.name} has been shooting exceptionally well from 3-point range (${team1Stats.threePointPct}%)`,
      )
      keyFactors.push(`${team1.name} enters the tournament with strong momentum from recent games`)

      if (team2Stats.keyPlayerStatus === "Injured") {
        keyFactors.push(`${team2.name} is dealing with key player injuries affecting their performance`)
      }
    }
    // If team2 is the underdog and wins
    else {
      team2Stats.offensiveEfficiency += 5
      team2Stats.threePointPct += 5
      team2Stats.recentForm = "Strong"

      if (team1Stats.keyPlayerStatus === "Healthy") {
        team1Stats.keyPlayerStatus = "Injured"
      }

      keyFactors.push(
        `${team2.name}'s offensive efficiency (${team2Stats.offensiveEfficiency}) exceeds expectations for a ${team2Seed} seed`,
      )
      keyFactors.push(
        `${team2.name} has been shooting exceptionally well from 3-point range (${team2Stats.threePointPct}%)`,
      )
      keyFactors.push(`${team2.name} enters the tournament with strong momentum from recent games`)

      if (team1Stats.keyPlayerStatus === "Injured") {
        keyFactors.push(`${team1.name} is dealing with key player injuries affecting their performance`)
      }
    }

    // Add historical upset factor
    keyFactors.push(
      `Historical data shows ${seedDifference}-seed upsets occur in approximately ${Math.round(20 - seedDifference)}% of tournament games`,
    )
  }
  // For expected outcomes (favorite wins), generate standard reasoning
  else {
    // If team1 is the favorite and wins
    if (team1Seed < team2Seed) {
      keyFactors.push(
        `${team1.name}'s superior offensive efficiency (${team1Stats.offensiveEfficiency} vs ${team2Stats.offensiveEfficiency})`,
      )
      keyFactors.push(
        `${team1.name}'s stronger defensive rating (${team1Stats.defensiveEfficiency} vs ${team2Stats.defensiveEfficiency})`,
      )

      if (team1Stats.strengthOfSchedule > team2Stats.strengthOfSchedule) {
        keyFactors.push(
          `${team1.name} faced a tougher schedule (SOS: ${team1Stats.strengthOfSchedule} vs ${team2Stats.strengthOfSchedule})`,
        )
      }

      if (seedDifference > 3) {
        keyFactors.push(
          `Significant seed difference (${team1Seed} vs ${team2Seed}) historically favors the higher seed`,
        )
      }
    }
    // If team2 is the favorite and wins
    else {
      keyFactors.push(
        `${team2.name}'s superior offensive efficiency (${team2Stats.offensiveEfficiency} vs ${team1Stats.offensiveEfficiency})`,
      )
      keyFactors.push(
        `${team2.name}'s stronger defensive rating (${team2Stats.defensiveEfficiency} vs ${team1Stats.defensiveEfficiency})`,
      )

      if (team2Stats.strengthOfSchedule > team1Stats.strengthOfSchedule) {
        keyFactors.push(
          `${team2.name} faced a tougher schedule (SOS: ${team2Stats.strengthOfSchedule} vs ${team1Stats.strengthOfSchedule})`,
        )
      }

      if (seedDifference > 3) {
        keyFactors.push(
          `Significant seed difference (${team2Seed} vs ${team1Seed}) historically favors the higher seed`,
        )
      }
    }
  }

  // Add a random additional factor
  const additionalFactors = [
    `Rebounding advantage (${team1Stats.reboundingRate}% vs ${team2Stats.reboundingRate}%)`,
    `Turnover differential (${team1Stats.turnoverRate}% vs ${team2Stats.turnoverRate}%)`,
    `Three-point shooting efficiency (${team1Stats.threePointPct}% vs ${team2Stats.threePointPct}%)`,
    `Recent performance trends favor the winner`,
    `Historical matchup results between these teams`,
    `Tournament experience factor`,
  ]

  keyFactors.push(additionalFactors[Math.floor(Math.random() * additionalFactors.length)])

  // Generate a summary
  let summary = ""
  if (isUpset) {
    summary = `This prediction represents an upset with the ${team1Seed > team2Seed ? team1Seed : team2Seed} seed defeating the ${team1Seed < team2Seed ? team1Seed : team2Seed} seed. The model identified several key factors that suggest the underdog has a strong chance to advance.`
  } else {
    summary = `This prediction follows the expected outcome with the favored team advancing. The model's analysis of team statistics and historical tournament data strongly supports this result.`
  }

  return {
    summary,
    keyFactors,
    teamComparison: {
      team1: {
        name: team1.name,
        seed: team1Seed,
        stats: team1Stats,
      },
      team2: {
        name: team2.name,
        seed: team2Seed,
        stats: team2Stats,
      },
    },
  }
}

/**
 * Generate mock prediction data that matches the expected format
 */
function generateMockPredictions() {
  const regions = ["West", "East", "South", "Midwest"]
  const teamNames = {
    West: {
      1: "Auburn",
      8: "Louisville",
      9: "Creighton",
      5: "Michigan",
      12: "UC San Diego",
      4: "Texas A&M",
      13: "Yale",
      6: "Ole Miss",
      11: "San Diego State",
      3: "Iowa State",
      14: "Lipscomb",
      7: "Marquette",
      10: "New Mexico",
      2: "Michigan State",
      15: "Bryant",
      16: "Alabama St.",
    },
    East: {
      1: "Duke",
      8: "Mississippi State",
      9: "Baylor",
      5: "Memphis",
      12: "Colorado State",
      4: "Maryland",
      13: "Grand Canyon",
      7: "Saint Mary's",
      10: "Vanderbilt",
      3: "Kentucky",
      14: "Troy",
      6: "Illinois",
      11: "Texas",
      2: "Alabama",
      15: "Robert Morris",
      16: "Saint Francis",
    },
    South: {
      1: "Florida",
      8: "UConn",
      9: "Oklahoma",
      5: "Memphis",
      12: "Colorado State",
      4: "Missouri",
      11: "Drake",
      3: "Texas Tech",
      14: "UNC Wilmington",
      7: "Kansas",
      10: "Arkansas",
      2: "Saint John's",
      15: "Omaha",
      16: "American",
      13: "Akron",
      6: "BYU",
    },
    Midwest: {
      1: "Houston",
      16: "Mount St. Mary's",
      8: "Mississippi State",
      9: "Baylor",
      5: "Oregon",
      12: "Liberty",
      4: "Arizona",
      13: "Akron",
      6: "BYU",
      11: "VCU",
      3: "Wisconsin",
      14: "Montana",
      7: "UCLA",
      10: "Utah State",
      2: "Tennessee",
      15: "Wofford",
    },
  }

  // Generate team IDs based on region and seed
  const teams = {}
  regions.forEach((region) => {
    Object.entries(teamNames[region]).forEach(([seed, name]) => {
      const id = `${region.toLowerCase()}_${seed}`
      teams[id] = { name, seed: Number.parseInt(seed), region }
    })
  })

  // Generate bracket structure
  const bracket = {}

  // Round 1 (64 teams) - First Round
  bracket[1] = []
  const seedMatchups = [
    [1, 16],
    [8, 9],
    [5, 12],
    [4, 13],
    [6, 11],
    [3, 14],
    [7, 10],
    [2, 15],
  ]

  regions.forEach((region) => {
    seedMatchups.forEach(([seed1, seed2]) => {
      // Skip if either team doesn't exist
      if (!teamNames[region][seed1] || !teamNames[region][seed2]) return

      const team1Id = `${region.toLowerCase()}_${seed1}`
      const team2Id = `${region.toLowerCase()}_${seed2}`

      const team1 = {
        id: team1Id,
        name: teamNames[region][seed1],
        seed: Number.parseInt(seed1),
        region,
      }

      const team2 = {
        id: team2Id,
        name: teamNames[region][seed2],
        seed: Number.parseInt(seed2),
        region,
      }

      // Determine winner (usually the higher seed, but add some upsets)
      const isUpset = Math.random() < 0.2
      const winnerId = isUpset ? team2Id : team1Id
      const winProb = isUpset ? 0.5 + Math.random() * 0.2 : 0.6 + Math.random() * 0.3

      // Generate detailed reasoning for this matchup
      const reasoning = generateMatchupReasoning(team1, team2, isUpset)

      bracket[1].push({
        matchup: {
          team1: team1Id,
          team2: team2Id,
          region: region,
          team1_name: teamNames[region][seed1],
          team2_name: teamNames[region][seed2],
          team1_seed: Number.parseInt(seed1),
          team2_seed: Number.parseInt(seed2),
        },
        prediction: {
          winner: winnerId,
          win_probability: winProb,
          point_difference: Math.random() * 15 + 2,
          reasoning: reasoning,
        },
      })
    })
  })

  // Generate subsequent rounds
  for (let round = 2; round <= 6; round++) {
    bracket[round] = []
    const prevRound = bracket[round - 1]

    // Group matchups by region for rounds 1-4
    if (round <= 4) {
      const regionWinners = {}
      regions.forEach((region) => {
        regionWinners[region] = prevRound
          .filter((game) => game.matchup.region === region)
          .map((game) => game.prediction.winner)
      })

      // Create matchups within each region
      regions.forEach((region) => {
        const winners = regionWinners[region]
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            const team1Id = winners[i]
            const team2Id = winners[i + 1]

            // Extract team info
            const team1Parts = team1Id.split("_")
            const team2Parts = team2Id.split("_")
            const team1Seed = Number.parseInt(team1Parts[1])
            const team2Seed = Number.parseInt(team2Parts[1])

            const team1 = {
              id: team1Id,
              name: teamNames[region][team1Seed],
              seed: team1Seed,
              region,
            }

            const team2 = {
              id: team2Id,
              name: teamNames[region][team2Seed],
              seed: team2Seed,
              region,
            }

            // Determine winner (favor lower seed with some randomness)
            const team1Favored = team1Seed < team2Seed
            const isUpset = Math.random() < 0.3
            const winnerId = (team1Favored && !isUpset) || (!team1Favored && isUpset) ? team1Id : team2Id
            const winProb = 0.5 + Math.random() * 0.3

            // Generate detailed reasoning for this matchup
            const reasoning = generateMatchupReasoning(
              team1,
              team2,
              (team1Favored && isUpset) || (!team1Favored && !isUpset),
            )

            bracket[round].push({
              matchup: {
                team1: team1Id,
                team2: team2Id,
                region: region,
                team1_name: teamNames[region][team1Seed],
                team2_name: teamNames[region][team2Seed],
                team1_seed: team1Seed,
                team2_seed: team2Seed,
              },
              prediction: {
                winner: winnerId,
                win_probability: winProb,
                point_difference: Math.random() * 12 + 1,
                reasoning: reasoning,
              },
            })
          }
        }
      })
    } else if (round === 5) {
      // Final Four - winners from each region face off
      const regionChampions = {}
      regions.forEach((region) => {
        const regionGames = prevRound.filter((game) => game.matchup.region === region)
        if (regionGames.length > 0) {
          regionChampions[region] = regionGames[0].prediction.winner
        }
      })

      // Create Final Four matchups (traditionally it's West vs East, South vs Midwest)
      const regionPairs = [
        ["West", "East"],
        ["South", "Midwest"],
      ]

      regionPairs.forEach(([region1, region2]) => {
        if (regionChampions[region1] && regionChampions[region2]) {
          const team1Id = regionChampions[region1]
          const team2Id = regionChampions[region2]

          // Extract team info
          const team1Parts = team1Id.split("_")
          const team2Parts = team2Id.split("_")
          const team1Seed = Number.parseInt(team1Parts[1])
          const team2Seed = Number.parseInt(team2Parts[1])

          const team1 = {
            id: team1Id,
            name: teamNames[region1][team1Seed],
            seed: team1Seed,
            region: region1,
          }

          const team2 = {
            id: team2Id,
            name: teamNames[region2][team2Seed],
            seed: team2Seed,
            region: region2,
          }

          // Determine winner
          const team1Favored = team1Seed < team2Seed
          const isUpset = Math.random() < 0.4 // More upsets in Final Four
          const winnerId = (team1Favored && !isUpset) || (!team1Favored && isUpset) ? team1Id : team2Id
          const winProb = 0.5 + Math.random() * 0.25

          // Generate detailed reasoning for this matchup
          const reasoning = generateMatchupReasoning(
            team1,
            team2,
            (team1Favored && isUpset) || (!team1Favored && !isUpset),
          )

          bracket[round].push({
            matchup: {
              team1: team1Id,
              team2: team2Id,
              team1_name: teamNames[region1][team1Seed],
              team2_name: teamNames[region2][team2Seed],
              team1_seed: team1Seed,
              team2_seed: team2Seed,
            },
            prediction: {
              winner: winnerId,
              win_probability: winProb,
              point_difference: Math.random() * 10 + 1,
              reasoning: reasoning,
            },
          })
        }
      })
    } else {
      // Championship - Final Four winners face off
      const finalFourWinners = prevRound.map((game) => game.prediction.winner)

      if (finalFourWinners.length >= 2) {
        const team1Id = finalFourWinners[0]
        const team2Id = finalFourWinners[1]

        // Extract team info
        const team1Parts = team1Id.split("_")
        const team2Parts = team2Id.split("_")
        const team1Region = team1Parts[0]
        const team2Region = team2Parts[0]
        const team1Seed = Number.parseInt(team1Parts[1])
        const team2Seed = Number.parseInt(team2Parts[1])

        // Find the region names (capitalized)
        const regionForTeam1 = regions.find((r) => r.toLowerCase() === team1Region)
        const regionForTeam2 = regions.find((r) => r.toLowerCase() === team2Region)

        const team1 = {
          id: team1Id,
          name: teamNames[regionForTeam1][team1Seed],
          seed: team1Seed,
          region: regionForTeam1,
        }

        const team2 = {
          id: team2Id,
          name: teamNames[regionForTeam2][team2Seed],
          seed: team2Seed,
          region: regionForTeam2,
        }

        // Determine champion
        const team1Favored = team1Seed < team2Seed
        const isUpset = Math.random() < 0.3
        const champion = (team1Favored && !isUpset) || (!team1Favored && isUpset) ? team1Id : team2Id

        // Generate detailed reasoning for this matchup
        const reasoning = generateMatchupReasoning(
          team1,
          team2,
          (team1Favored && isUpset) || (!team1Favored && !isUpset),
        )

        bracket[round].push({
          matchup: {
            team1: team1Id,
            team2: team2Id,
            team1_name: teamNames[regionForTeam1][team1Seed],
            team2_name: teamNames[regionForTeam2][team2Seed],
            team1_seed: team1Seed,
            team2_seed: team2Seed,
          },
          prediction: {
            winner: champion,
            win_probability: 0.5 + Math.random() * 0.4,
            point_difference: Math.random() * 8 + 2,
            reasoning: reasoning,
          },
        })
      }
    }
  }

  // Ensure we have a championship game (round 6)
  if (!bracket[6] || bracket[6].length === 0) {
    console.log("Generating championship game manually")

    // Take the winners from the Final Four
    if (bracket[5] && bracket[5].length >= 2) {
      const finalist1 = bracket[5][0].prediction.winner
      const finalist2 = bracket[5][1].prediction.winner

      // Extract team info
      const team1Parts = finalist1.split("_")
      const team2Parts = finalist2.split("_")
      const team1Region = team1Parts[0]
      const team2Region = team2Parts[0]
      const team1Seed = Number.parseInt(team1Parts[1])
      const team2Seed = Number.parseInt(team2Parts[1])

      // Find the region names (capitalized)
      const regionForTeam1 = regions.find((r) => r.toLowerCase() === team1Region)
      const regionForTeam2 = regions.find((r) => r.toLowerCase() === team2Region)

      const team1 = {
        id: finalist1,
        name: teamNames[regionForTeam1][team1Seed],
        seed: team1Seed,
        region: regionForTeam1,
      }

      const team2 = {
        id: finalist2,
        name: teamNames[regionForTeam2][team2Seed],
        seed: team2Seed,
        region: regionForTeam2,
      }

      // Determine champion
      const team1Favored = team1Seed < team2Seed
      const isUpset = Math.random() < 0.2
      const champion = (team1Favored && !isUpset) || (!team1Favored && isUpset) ? finalist1 : finalist2

      // Generate detailed reasoning for this matchup
      const reasoning = generateMatchupReasoning(team1, team2, (team1Favored && isUpset) || (!team1Favored && !isUpset))

      bracket[6] = [
        {
          matchup: {
            team1: finalist1,
            team2: finalist2,
            team1_name: teamNames[regionForTeam1][team1Seed],
            team2_name: teamNames[regionForTeam2][team2Seed],
            team1_seed: team1Seed,
            team2_seed: team2Seed,
          },
          prediction: {
            winner: champion,
            win_probability: 0.5 + Math.random() * 0.4,
            point_difference: Math.random() * 8 + 2,
            reasoning: reasoning,
          },
        },
      ]
    }
  }

  return bracket
}

/**
 * Generate mock logs
 */
function generateMockLogs() {
  const startTime = new Date()
  const endTime = new Date(startTime.getTime() + 30000) // 30 seconds later

  return {
    prediction_start_time: startTime.toISOString(),
    prediction_end_time: endTime.toISOString(),
    model_parameters: {
      lstm_lookback: 10,
      mean_regression_lookback: 5,
    },
    training_metrics: {
      lstm_loss: 0.0023,
      regression_mse: 0.0045,
    },
    prediction_summary: {
      total_games: 63,
      upsets: 12,
      close_games: 24,
    },
    execution_log: [
      "Initializing tournament teams...",
      "Creating bracket structure...",
      "Fetching team statistics...",
      "Training prediction models...",
      "Building bracket predictions...",
      "Prediction complete!",
    ],
    team_performance: {
      Duke: {
        effective_fg_pct: 0.56,
        turnover_pct: 0.12,
        offensive_rebound_pct: 0.32,
        defensive_efficiency: 92.4,
      },
      Houston: {
        effective_fg_pct: 0.54,
        turnover_pct: 0.11,
        offensive_rebound_pct: 0.35,
        defensive_efficiency: 89.7,
      },
      Auburn: {
        effective_fg_pct: 0.53,
        turnover_pct: 0.14,
        offensive_rebound_pct: 0.31,
        defensive_efficiency: 93.2,
      },
      Florida: {
        effective_fg_pct: 0.52,
        turnover_pct: 0.13,
        offensive_rebound_pct: 0.29,
        defensive_efficiency: 94.5,
      },
    },
    upset_analysis: {
      biggest_upset: "15 seed over 2 seed",
      upset_regions: ["West", "East"],
      upset_rounds: [1, 2],
    },
  }
}

